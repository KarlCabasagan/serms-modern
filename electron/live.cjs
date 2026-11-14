const { Client } = require('pg')
const { BufferReader } = require('pg-protocol/dist/buffer-reader')

let client = null
let utf8Mode = true
let decodeText = (buffer) => buffer.toString('utf8')
const decodeUtf8String = BufferReader.prototype.string
const decodeUtf8CString = BufferReader.prototype.cstring

// pg decodes every text field as UTF-8. The school database is SQL_ASCII and
// contains Latin-1 bytes such as Ñ, which makes PostgreSQL reject the SELECT
// when the client asks for UTF-8. Switch both sides to a lossless single-byte
// decoding after login, before any row is read.
BufferReader.prototype.string = function string(length) {
  if (utf8Mode) return decodeUtf8String.call(this, length)
  const value = decodeText(this.buffer.subarray(this.offset, this.offset + length))
  this.offset += length
  return value
}

BufferReader.prototype.cstring = function cstring() {
  if (utf8Mode) return decodeUtf8CString.call(this)
  const start = this.offset
  const end = this.buffer.indexOf(0, start)
  this.offset = end === -1 ? this.buffer.length : end + 1
  return decodeText(this.buffer.subarray(start, end === -1 ? this.buffer.length : end))
}

function num(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function trim(value) {
  return String(value ?? '').trim()
}

function yearLabel(level) {
  const value = Number(level)
  if (value === 1) return '1st Year'
  if (value === 2) return '2nd Year'
  if (value === 3) return '3rd Year'
  if (value === 4) return '4th Year'
  if (value === 5) return '5th Year'
  return '—'
}

function semesterLabel(sem) {
  if (trim(sem) === '1') return 'First Semester'
  if (trim(sem) === '2') return 'Second Semester'
  if (trim(sem).toUpperCase() === 'S') return 'Summer'
  return `Term ${trim(sem)}`
}

function isoDate(value) {
  if (!value) return ''
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  return String(value).slice(0, 10)
}

function useUtf8() {
  utf8Mode = true
  decodeText = (buffer) => buffer.toString('utf8')
}

async function configureClientEncoding(db) {
  const row = (await db.query('show server_encoding')).rows[0]
  const serverEncoding = String(row?.server_encoding || '').toUpperCase()
  if (!serverEncoding || serverEncoding === 'UTF8') {
    useUtf8()
    return
  }

  const clientEncoding = serverEncoding === 'WIN1252' ? 'WIN1252' : 'LATIN1'
  const decoderLabel = serverEncoding === 'WIN1252' ? 'windows-1252' : 'iso-8859-1'
  await db.query(`set client_encoding to '${clientEncoding}'`)
  utf8Mode = false
  try {
    const decoder = new TextDecoder(decoderLabel)
    decodeText = (buffer) => decoder.decode(buffer)
  } catch {
    decodeText = (buffer) => buffer.toString('latin1')
  }
}

function createClient(config, credentials) {
  return new Client({
    host: config.host,
    port: config.port,
    database: config.database,
    user: credentials.username,
    password: credentials.password,
    connectionTimeoutMillis: 7000,
  })
}

async function connect(config, credentials) {
  if (client) {
    await client.end().catch(() => {})
    client = null
  }
  const next = createClient(config, credentials)
  try {
    await next.connect()
    // Keep the startup packet to the standard user/database fields and set the
    // schema after connecting; this avoids differences in how server builds
    // treat startup-time options.
    await next.query('set search_path to srgb,public,pis,ngas,fis,payroll')
    await configureClientEncoding(next)
    client = next
    return await bootstrap()
  } catch (error) {
    if (client === next) client = null
    await next.end().catch(() => {})
    throw error
  }
}

async function disconnect() {
  if (client) {
    await client.end().catch(() => {})
    client = null
  }
  useUtf8()
}

async function bootstrap() {
  if (!client) throw new Error('No live connection is open.')

  let termRow = (
    await client.query(
      'select sy, sem from srgb.semester where current order by sy desc, sem desc limit 1',
    )
  ).rows[0]
  if (!termRow) {
    termRow = (
      await client.query('select sy, sem from srgb.semester order by sy desc, sem desc limit 1')
    ).rows[0]
  }
  if (!termRow) throw new Error('No semester is configured in srgb.semester.')

  const sy = trim(termRow.sy)
  const sem = trim(termRow.sem)
  const term = {
    ay: sy,
    semester: semesterLabel(sem),
    label: `${semesterLabel(sem)} · AY ${sy}`,
    sem,
  }

  try {
    await client.query(`
      create or replace function pg_temp.safe_gpa(p_studid text)
      returns real language plpgsql as $$
      begin
        return srgb.compute_gpa_all(p_studid);
      exception when others then
        return null;
      end;
      $$;
    `)
  } catch {
    // The GPA is optional; the read-only preview should still open without this helper.
  }

  const studentRows = (
    await client.query(
      `select s.studid, s.studlastname, s.studfirstname, s.studmidname, s.studsuffix,
              s.studgender, s.studbirthdate, s.studcontactno, s.studpermaddr,
              ss.studlevel, ss.studmajor, ss.registered, ss.studunits, ss.studgrad,
              p.progdesc, coalesce(d.deptcoll, '') as deptcoll, coalesce(c.collname, '') as collname,
              coalesce(srgb.get_balance_perstudent(ss.sy, ss.sem, s.studid), 0) as balance,
              coalesce(pg_temp.safe_gpa(s.studid), 0) as gpa,
              coalesce(a.totalfee, 0) as assessment_total
       from srgb.semstudent ss
       join srgb.student s using (studid)
       left join srgb.program p on p.progcode = ss.studmajor
       left join srgb.department d on d.deptcode = p.progdept
       left join srgb.college c on c.collcode = d.deptcoll
       left join lateral (
         select * from srgb.get_assessment_summary_persem(ss.sy, ss.sem, s.studid)
       ) a on true
       where ss.sy = $1 and ss.sem = $2
       order by s.studlastname, s.studfirstname`,
      [sy, sem],
    )
  ).rows

  const students = studentRows.map((row) => {
    const assessmentTotal = num(row.assessment_total)
    const balance = num(row.balance)
    const registered = Boolean(row.registered)
    return {
      id: trim(row.studid),
      firstName: trim(row.studfirstname),
      middleName: trim(row.studmidname),
      lastName: trim(row.studlastname),
      suffix: trim(row.studsuffix) || undefined,
      program: trim(row.studmajor),
      programName: trim(row.progdesc) || trim(row.studmajor),
      college: trim(row.collname) || trim(row.deptcoll),
      year: yearLabel(row.studlevel),
      status: row.studgrad ? 'Graduating' : registered ? 'Enrolled' : 'Unregistered',
      scholarship: 'None',
      email: '',
      phone: trim(row.studcontactno),
      address: trim(row.studpermaddr),
      birthDate: isoDate(row.studbirthdate) || '2000-01-01',
      gender: trim(row.studgender) === 'M' ? 'M' : 'F',
      units: num(row.studunits),
      gpa: num(row.gpa),
      assessmentTotal,
      amountPaid: Math.max(0, assessmentTotal - balance),
      balance,
      adviser: '',
      enrolledAt: new Date().toISOString().slice(0, 10),
    }
  })

  const enrollmentRows = (
    await client.query(
      `select r.studid, r.subjcode, subj.subjdesc, coalesce(subj.subjcredit, 0) as units,
              r.section, ss.days, ss.time, ss.room,
              coalesce(nullif(trim(e.lastname), '') || ', ' || coalesce(e.firstname, ''), '') as instructor,
              r.prelim1, r.prelim2, r.prelim3, r.prelim4, r.grade, r.remarks
       from srgb.registration r
       join srgb.subject subj on subj.subjcode = r.subjcode
       left join srgb.semsubject ss
         on ss.sy = r.sy and ss.sem = r.sem and ss.subjcode = r.subjcode and ss.section = r.section
       left join pis.employee e on e.empid = ss.facultyid
       where r.sy = $1 and r.sem = $2
       order by r.studid, r.subjcode`,
      [sy, sem],
    )
  ).rows

  const enrollments = enrollmentRows.map((row) => ({
    studentId: trim(row.studid),
    code: trim(row.subjcode),
    title: trim(row.subjdesc),
    units: num(row.units),
    section: trim(row.section),
    schedule: [trim(row.days), trim(row.time)].filter(Boolean).join(' · '),
    room: trim(row.room),
    instructor: trim(row.instructor),
    status: 'Enrolled',
    prelim: trim(row.prelim1) || undefined,
    midterm: trim(row.prelim2) || undefined,
    prefinal: trim(row.prelim3) || undefined,
    final: trim(row.prelim4) || undefined,
    grade: trim(row.grade) || undefined,
    remark: trim(row.remarks) || undefined,
  }))

  const paymentRows = (
    await client.query(
      `select p.orno, p.paycode, p.studid, p.payee, p.paydate, p.fund, p."user",
              coalesce(p.tuitionfee, 0) + coalesce(p.labfee, 0) + coalesce(p.compfee, 0) +
              coalesce(p.libfee, 0) + coalesce(p.athlfee, 0) + coalesce(p.medfee, 0) +
              coalesce(p.spubfee, 0) + coalesce(p.sgovfee, 0) + coalesce(p.studentfee, 0) +
              coalesce(p.regfee, 0) + coalesce(p.idfee, 0) + coalesce(p.facilitiesfee, 0) +
              coalesce(p.guidancefee, 0) + coalesce(p.ched_fee, 0) + coalesce(p.otherfee, 0) as amount
       from srgb.payment p
       where p.sy = $1 and p.sem = $2
       order by p.paydate desc, p.orno desc
       limit 500`,
      [sy, sem],
    )
  ).rows

  const payments = paymentRows.map((row) => ({
    id: `live-pay-${trim(row.orno)}`,
    orno: `OR-${trim(row.orno)}`,
    studentId: trim(row.studid),
    studentName: trim(row.payee),
    date: isoDate(row.paydate),
    amount: num(row.amount),
    paycode: trim(row.paycode),
    fund:
      trim(row.fund) === 'TF'
        ? 'Trust Fund'
        : trim(row.fund) === 'GF'
          ? 'General Fund'
          : trim(row.fund) || '—',
    cashier: trim(row.user) || 'Cashier',
    status: 'Posted',
  }))

  const assessmentLines = {}
  try {
    const assessmentRows = (
      await client.query(
        `select ad.studid, ad.feecode, f.feedesc, ad.amt
         from srgb.ass_details ad
         join srgb.fees f on f.feecode = ad.feecode
         where ad.sy = $1 and ad.sem = $2
         order by ad.studid, f.ord nulls last, ad.feecode`,
        [sy, sem],
      )
    ).rows
    for (const row of assessmentRows) {
      const studentId = trim(row.studid)
      if (!assessmentLines[studentId]) assessmentLines[studentId] = []
      assessmentLines[studentId].push({
        code: trim(row.feecode),
        label: trim(row.feedesc) || trim(row.feecode),
        amount: num(row.amt),
      })
    }
  } catch {
    // Older deployments may not have ass_details populated; the total still works.
  }

  return {
    term,
    students,
    enrollments,
    payments,
    assessmentLines,
    stats: {
      students: students.length,
      enrolled: students.filter((student) => student.status === 'Enrolled').length,
      unregistered: students.filter((student) => student.status === 'Unregistered').length,
      balance: students.reduce((sum, student) => sum + student.balance, 0),
      collected: payments.reduce((sum, payment) => sum + payment.amount, 0),
    },
    readOnly: true,
  }
}

async function saveGrades({ sy, sem, rows }) {
  if (!client) throw new Error('No live connection is open.')
  if (!Array.isArray(rows) || rows.length === 0) throw new Error('No grade rows were supplied.')

  let updated = 0
  await client.query('begin')
  try {
    for (const row of rows) {
      const result = await client.query(
        `update srgb.registration
         set prelim1 = $1, prelim2 = $2, prelim3 = $3, prelim4 = $4,
             remarks = $5
         where sy = $6 and sem = $7 and studid = $8 and subjcode = $9`,
        [
          row.prelim1 || null,
          row.prelim2 || null,
          row.prelim3 || null,
          row.prelim4 || null,
          row.remarks || null,
          sy,
          sem,
          row.studid,
          row.subjcode,
        ],
      )
      updated += result.rowCount
    }
    if (updated !== rows.length) {
      throw new Error('One or more grade rows no longer match the database. Nothing was saved.')
    }
    await client.query('commit')
    return { updated }
  } catch (error) {
    await client.query('rollback').catch(() => {})
    throw error
  }
}

module.exports = { connect, disconnect, bootstrap, saveGrades }
