const { Client } = require('pg')
const { BufferReader } = require('pg-protocol/dist/buffer-reader')

let client = null
let activeTerm = null
let activeFacultyId = null
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
  activeTerm = null
  activeFacultyId = null
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
  activeTerm = { sy, sem }
  const term = {
    ay: sy,
    semester: semesterLabel(sem),
    label: `${semesterLabel(sem)} · AY ${sy}`,
    sem,
  }

  const studentRows = (
    await client.query(
      `select s.studid, s.studlastname, s.studfirstname, s.studmidname, s.studsuffix,
              s.studgender, s.studbirthdate, s.studcontactno, s.studpermaddr,
              ss.studlevel, ss.studmajor, ss.registered, ss.studunits, ss.studgrad,
              p.progdesc, coalesce(d.deptcoll, '') as deptcoll, coalesce(c.collname, '') as collname,
              coalesce(a.total, 0) as assessment_total,
              coalesce(a.current_total, 0) as current_assessment_total,
              greatest(coalesce(a.total, 0) - coalesce(pay.paid, 0), 0) as balance,
              coalesce(g.gpa, 0) as gpa
       from srgb.semstudent ss
       join srgb.student s using (studid)
       left join srgb.program p on p.progcode = ss.studmajor
       left join srgb.department d on d.deptcode = p.progdept
       left join srgb.college c on c.collcode = d.deptcoll
       left join (
         select ad.studid,
                sum(ad.amt) as total,
                sum(case when not coalesce(f.is_oldaccount, false) then ad.amt else 0 end) as current_total
         from srgb.ass_details ad
         left join srgb.fees f using (feecode)
         where ad.sy = $1 and ad.sem = $2
         group by ad.studid
       ) a using (studid)
       left join (
         select ch.studid, sum(cd.amt) as paid
         from srgb.collection_details cd
         join srgb.collection_header ch using (orno)
         where ch.sy = $1 and ch.sem = $2
         group by ch.studid
       ) pay using (studid)
       left join (
         select r.studid,
                sum(subj.subjcredit * v.grade_equiv) / nullif(sum(subj.subjcredit), 0) as gpa
         from srgb.registration r
         join srgb.subject subj using (subjcode)
         join srgb.validgrades v
           on v.grade = case
                when r.grade in ('INC', '4.00') and coalesce(r.gcompl, '') <> '' then r.gcompl
                else r.grade
              end
          and (case when r.grade in ('INC', '4.00') then v.completion else true end)
         where subj.subjgpa and r.grade is not null and subj.subjdept <> 'ROTC' and v.grade_equiv > 0
         group by r.studid
       ) g using (studid)
       where ss.sy = $1 and ss.sem = $2
       order by s.studlastname, s.studfirstname`,
      [sy, sem],
    )
  ).rows

  const students = studentRows.map((row) => {
    const assessmentTotal = num(row.current_assessment_total)
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

  const facultyRows = (
    await client.query(
      `select e.empid, e.lastname, e.firstname
       from pis.employee e
       where e.empid in (
         select distinct ss.facultyid from srgb.semsubject ss where ss.sy = $1 and ss.sem = $2
       )`,
      [sy, sem],
    )
  ).rows
  const instructors = new Map(
    facultyRows.map((row) => [
      trim(row.empid),
      [trim(row.lastname), trim(row.firstname)].filter(Boolean).join(', '),
    ]),
  )

  const enrollmentRows = (
    await client.query(
      `select r.studid, r.subjcode, subj.subjdesc, coalesce(subj.subjcredit, 0) as units,
              r.section, ss.days, ss.time, ss.room, ss.facultyid,
              r.prelim1, r.prelim2, r.prelim3, r.prelim4, r.grade, r.remarks
       from srgb.registration r
       join srgb.subject subj on subj.subjcode = r.subjcode
       left join srgb.semsubject ss
         on ss.sy = r.sy and ss.sem = r.sem and ss.subjcode = r.subjcode and ss.section = r.section
       where r.sy = $1 and r.sem = $2`,
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
    instructor: instructors.get(trim(row.facultyid)) || '',
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

  const faculty = await loadFaculty(sy, sem)

  return {
    term,
    students,
    enrollments,
    payments,
    faculty,
    assessmentLines: {},
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

async function loadFaculty(sy, sem) {
  const profile = (
    await client.query(
      `select fu.empid, e.fullname, f.deptcode, d.deptname
       from srgb.faculty_username fu
       join pis.employee e on e.empid = fu.empid
       left join srgb.faculty f on f.empid = fu.empid
       left join srgb.department d on d.deptcode = f.deptcode
       where lower(fu.username) = lower(current_user)
       limit 1`,
    )
  ).rows[0]
  if (!profile) {
    activeFacultyId = null
    return null
  }
  activeFacultyId = trim(profile.empid)

  const classRows = (
    await client.query(
      `select ss.subjcode, subj.subjdesc, coalesce(subj.subjcredit, 0) as units,
              ss.section, ss.days, ss.time, ss.room, ss.maxstud,
              count(r.studid)::int as enrolled
       from srgb.semsubject ss
       join srgb.subject subj on subj.subjcode = ss.subjcode
       left join srgb.registration r
         on r.sy = ss.sy and r.sem = ss.sem and r.subjcode = ss.subjcode and r.section = ss.section
       where ss.sy = $1 and ss.sem = $2 and ss.facultyid = $3
       group by ss.subjcode, subj.subjdesc, subj.subjcredit, ss.section, ss.days, ss.time, ss.room, ss.maxstud
       order by ss.subjcode, ss.section`,
      [sy, sem, profile.empid],
    )
  ).rows

  return {
    id: trim(profile.empid),
    name: trim(profile.fullname),
    department: trim(profile.deptname),
    classes: classRows.map((row) => {
      const code = trim(row.subjcode)
      const section = trim(row.section)
      return {
        code,
        title: trim(row.subjdesc),
        section,
        units: num(row.units),
        schedule: [trim(row.days), trim(row.time)].filter(Boolean).join(' · '),
        room: trim(row.room),
        capacity: num(row.maxstud),
        enrolled: num(row.enrolled),
        students: [],
      }
    }),
  }
}

async function facultyRoster({ code, section }) {
  if (!client || !activeTerm || !activeFacultyId) {
    throw new Error('No faculty load is open.')
  }
  const rows = (
    await client.query(
      `select r.studid, s.studlastname, s.studfirstname, s.studmidname,
              ss2.studlevel, p.progdesc, r.prelim1, r.prelim2, r.prelim3, r.prelim4, r.grade, r.remarks
       from srgb.semsubject ss
       join srgb.registration r
         on r.sy = ss.sy and r.sem = ss.sem and r.subjcode = ss.subjcode and r.section = ss.section
       join srgb.student s using (studid)
       left join srgb.semstudent ss2
         on ss2.sy = r.sy and ss2.sem = r.sem and ss2.studid = r.studid
       left join srgb.program p on p.progcode = ss2.studmajor
       where ss.sy = $1 and ss.sem = $2 and ss.facultyid = $3
         and ss.subjcode = $4 and ss.section = $5
       order by s.studlastname, s.studfirstname`,
      [activeTerm.sy, activeTerm.sem, activeFacultyId, code, section],
    )
  ).rows
  return rows.map((row) => ({
    id: trim(row.studid),
    name: [trim(row.studlastname), trim(row.studfirstname), trim(row.studmidname)]
      .filter(Boolean)
      .join(', '),
    program: trim(row.progdesc),
    year: yearLabel(row.studlevel),
    prelim: trim(row.prelim1) || undefined,
    midterm: trim(row.prelim2) || undefined,
    prefinal: trim(row.prelim3) || undefined,
    final: trim(row.prelim4) || undefined,
    grade: trim(row.grade) || undefined,
    remark: trim(row.remarks) || undefined,
  }))
}

async function saveFacultyGrade({ studid, subjcode, section, prelim1, prelim2, prelim3, prelim4 }) {
  if (!client || !activeTerm || !activeFacultyId) {
    throw new Error('No faculty load is open.')
  }
  const assigned = await client.query(
    `select 1
     from srgb.semsubject ss
     where ss.sy = $1 and ss.sem = $2 and ss.facultyid = $3
       and ss.subjcode = $4 and ss.section = $5
     limit 1`,
    [activeTerm.sy, activeTerm.sem, activeFacultyId, subjcode, section],
  )
  if (assigned.rowCount === 0) {
    throw new Error('This class is not assigned to the signed-in faculty account.')
  }

  const result = await client.query(
    `update srgb.registration
     set prelim1 = $1, prelim2 = $2, prelim3 = $3, prelim4 = $4
     where sy = $5 and sem = $6 and studid = $7 and subjcode = $8
       and trim(section) = trim($9)
     returning prelim1, prelim2, prelim3, prelim4, grade, remarks`,
    [
      prelim1 || null,
      prelim2 || null,
      prelim3 || null,
      prelim4 || null,
      activeTerm.sy,
      activeTerm.sem,
      studid,
      subjcode,
      section,
    ],
  )
  if (result.rowCount !== 1) {
    throw new Error('The student grade row no longer matches this class. Nothing was saved.')
  }
  const row = result.rows[0]
  return {
    id: trim(studid),
    prelim: trim(row.prelim1) || undefined,
    midterm: trim(row.prelim2) || undefined,
    prefinal: trim(row.prelim3) || undefined,
    final: trim(row.prelim4) || undefined,
    grade: trim(row.grade) || undefined,
    remark: trim(row.remarks) || undefined,
  }
}

async function assessmentLinesFor(studid) {
  if (!client || !activeTerm) throw new Error('No live connection is open.')
  const rows = (
    await client.query(
      `select ad.feecode, f.feedesc, ad.amt
       from srgb.ass_details ad
       join srgb.fees f on f.feecode = ad.feecode
       where ad.sy = $1 and ad.sem = $2 and ad.studid = $3
       order by f.ord nulls last, ad.feecode`,
      [activeTerm.sy, activeTerm.sem, studid],
    )
  ).rows
  return rows.map((row) => ({
    code: trim(row.feecode),
    label: trim(row.feedesc) || trim(row.feecode),
    amount: num(row.amt),
  }))
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

module.exports = { connect, disconnect, bootstrap, saveGrades, assessmentLinesFor, facultyRoster, saveFacultyGrade }
