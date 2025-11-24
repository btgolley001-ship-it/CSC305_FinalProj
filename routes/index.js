var express = require('express');
var router = express.Router();


router.get('/', function(req, res, next) {
  console.log('req.query (GET): '+JSON.stringify(req.query));
  req.body = req.query; // Now behaves very much like POST
  res.render('index', {title: 'Role Selector',
                       formdata: req.body});
});


router.post('/role', function(req, res, next) {
  console.log('req.body (POST): '+JSON.stringify(req.body));
  
  var { id, role } = req.body; 

  console.log('req.body.id: '+JSON.stringify(req.body.id)
              +'\n\nid: '+JSON.stringify(id)
              +'\n\nreq.body.role: '+JSON.stringify(req.body.role)
              +'\n\nrole: '+JSON.stringify(role)
              )
  /* req.body.role isn't saving to role. i don't know why.
   * seems like it's being recorded fine here. but when it gets to renderpage(), role is made empty.
   * duct-tape solution: replace "role" w/ "req.body.role" when running renderpage()
   */

  changeEnrollment(req, res, next, id, role);
});

/*
 * If there is a query to run to change the Enrollment table, run it.
 * In any case, run listWinterOfferings next.
 */
function changeEnrollment(req, res, next, id, role) { // REMINDER: need to fix up this code!
  console.log(`changeEnrollment: ${req.body.action}`);

  // student.pug changes

  if (req.body.action && req.body.role === 'student') {
    let sql = 'SELECT 3+2;';  // Do something harmless if sql doesn't get set properly
    fields = ['OfferNo', 'EnrGrade'];
    
    // course_add

    if (req.body.action == 'course_add') {
      sql = 'INSERT INTO Enrollment(StdSSN,';
      for (field of fields) {
        sql += `,${field}`;
      }
      sql += `) VALUES ('${req.body.FacSSN}'`;
      for (field of fields) {
        sql += `,'${req.body[field]}'`;
      }
      sql += ');';
      // INSERT INTO Enrollment(StdSSN, OfferNo, EnrGrade) VALUES({id}, {OfferNo}, {EnrGrade});
    }
    
    // course_drop
    
    else if (req.body.action == 'course_drop') {
      sql = `DELETE * FROM Enrollment WHERE StdSSN='${req.body.StdSSN}' and OfferNo=`;
      sql += `,'${req.body['OfferNo']}'`;
      sql += ';';
      // DELETE * FROM Enrollment WHERE StdSSN = '{StdSNN}' and OfferNo = '{OfferNo}'
    }

    console.log("\nchangeEnrollment, if role = 'student', sql: "+sql+"\n");

    // Callback function defined in the old style so that this.changes gets the
    //     number of rows affected.
    function sqlCallback(err) {
      if (err) {
        throw err;
      }
      console.log(`${this.changes} rows affected.`)
      listWinterOfferings(req, res, next, id, role);
    }

    req.app.locals.db.run(sql, [], sqlCallback);
  }

  // teacher.pug changes

  else if (req.body.action && req.body.role === 'teacher') {
    let sql = 'SELECT 3+2;';  // Do something harmless if sql doesn't get set properly
    console.log(sql);

    // student_grade

    if (req.body.action == 'course_drop') {
      sql = `Update Enrollment SET EnrGrade = '${req.body.EnrGrade}'`;
      update_fields = fields.slice(3,7).concat(['FacSupervisor','FacZipCode']);
      for (field of update_fields) {
        sql += `,${field} = '${req.body[field]}'`;
      }
      sql += ` WHERE StdSSN = '${req.body.StdSSN}';`;
      sql += ` and OfferNo = '${req.body.OfferNo}';`;
      // Update Enrollment SET EnrGrade = {EnrGrade} WHERE StdSSN = {StdSSN} and OfferNo = {OfferNo};
    }

    ("\nchangeEnrollment, if role = 'teacher', sql: "+sql+"\n");

    // Callback function defined in the old style so that this.changes gets the
    //     number of rows affected.
    function sqlCallback(err) {
      if (err) {
        throw err;
      }
      console.log(`${this.changes} rows affected.`)
      listWinterOfferings(req, res, next, id, role);
    }

    req.app.locals.db.run(sql, [], sqlCallback);
  }

  else {
    listWinterOfferings(req, res, next, id, role);
  }
}

/*
 * default:
 * SELECT OfferNo, CourseNo, OffTerm, OffYear, OffDays, OffTime, OffLocation, FacSSN 
 * FROM Offering 
 * WHERE OffTerm = 'WINTER' and OffYear = 2025;
 *
 * Set req.locals.WinterOfferings to a list of the courses offered in Winter 2025.
 * Run inquireFaculty() next.
 */
function listWinterOfferings(req, res, next, id, role) {
  // This is all the columns in the Offering table.  The column names are
  // specified explicitly in the SQL to control the order of the columns
  // in the result.
  let sql = "SELECT OfferNo, CourseNo, OffTerm, OffYear, OffDays, OffTime, OffLocation, FacSSN from Offering WHERE OffTerm = 'WINTER' and OffYear = 2025;";
  
  if (req.body.role == 'student') {

    sql = "SELECT CourseNo as 'Course Number', FacFirstName, FacLastName,"
    sql += " OffLocation as 'Location',"
    sql += " OffTime as 'Time', OffDays as 'Days'"
    sql += " FROM Offering natural join Faculty"
    sql += " WHERE OffTerm = 'WINTER' and OffYear = 2025;"

    // SELECT CourseNo as 'Course Number', 
    //        FacFirstName, FacLastName, // combined into one column as 'Instructor' in student.pug
    //        OffLocation as 'Location', 
    //        OffTime as 'Time', OffDays as 'Days'
    // FROM Offering natural join Faculty
    // WHERE OffTerm = 'WINTER' and OffYear = 2025;
  }
  
  if (req.body.role == 'registrar') {

    sql = "SELECT OfferNo as 'Offering Number', CourseNo as 'Course Number',"
    sql += " FacFirstName, FacLastName,"
    sql += " OffLocation as 'Location',"
    sql += " OffTime as 'Time', OffDays as 'Days'"
    sql += " FROM Offering natural join Faculty"
    sql += " WHERE OffTerm = 'WINTER' and OffYear = 2025;"

    // SELECT OfferNo as 'Offering Number', CourseNo as 'Course Number', 
    //        FacFirstName, FacLastName, // combined into one column as 'Instructor' in registrar.pug
    //        OffLocation as 'Location', 
    //        OffTime as 'Time', OffDays as 'Days'
    // FROM Offering natural join Faculty
    // WHERE OffTerm = 'WINTER' and OffYear = 2025;
  }

  console.log("\nlistWinterOfferings, sql: "+sql+"\n");

  req.app.locals.db.get(sql, [req.body.id], (err, row) => {
      if (err) {
        throw err;
      }
      req.app.locals.facDetails = row;
    });

  inquireFaculty(req, res, next, id, role);
}

/*
 * SELECT {*}
 * FROM Faculty
 * WHERE FacSSN = {id};
 *
 * Set req.app.locals.facDetails to all the details about a given faculty member.
 * Run teacherTeaching() next.
 */
function inquireFaculty(req, res, next, id, role) {
  if (req.body.id) {
    // This is all the columns in the Faculty table.  The column names are
    // specified explicitly in the SQL to control the order of the columns
    // in the result.
    sql = 'SELECT FacSSN, FacFirstName, FacLastName, FacCity, FacState, FacZipCode, FacDept, FacRank, FacSalary, FacSupervisor, FacHireDate';
    sql += ' FROM Faculty WHERE FacSSN = ';
    sql += id;
    sql += ';';
    req.app.locals.db.get(sql, [req.body.id], (err, row) => {
      if (err) {
        throw err;
      }
      req.app.locals.facDetails = row;
    });
  }
  else {
    req.app.locals.facDetails = undefined;
  }

  console.log("\ninquireFaculty, sql: "+sql+"\n");

  teacherTeaching(req, res, next, id, role);
}

/*
 * SELECT CourseNo, OffTerm, OffYear 
 * FROM Offering 
 * WHERE FacSSN = {id};
 *
 * Set req.app.locals.facTeaching to information about the courses a teacher is associated with.
 * Run teacherGrading() next.
 */
function teacherTeaching(req, res, next, id, role) {
  if (req.body.id) {
    sql = 'SELECT CourseNo, OffTerm, OffYear';
    sql += ' FROM Offering';
    sql += ' WHERE FacSSN = '
    sql += id;
    sql += ';';
    req.app.locals.db.get(sql, [req.body.id], (err, row) => {
      if (err) {
        throw err;
      }
      req.app.locals.facTeaching = row;
    });
  }
  else {
    req.app.locals.facTeaching = undefined;
  }

  console.log("\nteacherTeaching, sql: "+sql+"\n");

  teacherGrading(req, res, next, id, role); 
}

/*
 * SELECT StdFirstName, StdLastName, StdSSN, EnrGrade
 * FROM Student natural join Enrollment natural join Offering
 * WHERE OfferNo = 9876 and FacSSN = 654321098;
 * 
 * Set req.app.locals.teacherGrading to the information needed for the view of the table when editing grades.
 * Run inquireStudent() next.
 */
function teacherGrading(req, res, next, id, role) {
  if (req.body.id) {
    sql = 'SELECT StdFirstName, StdLastName, StdSSN, EnrGrade';
    sql += ' FROM Student natural join Enrollment natural join Offering';
    sql += ' WHERE OfferNo = '
    sql += req.body.course_to_grade; // input TBA in teacher.pug
    sql += ' and FacSSN = '
    sql += id;
    sql += ';';
    req.app.locals.db.get(sql, [req.body.id], (err, row) => {
      if (err) {
        throw err;
      }
      req.app.locals.teacherGrading = row;
    });
  }
  else {
    req.app.locals.teacherGrading = undefined;
  }

  console.log("\nteacherGrading, sql: "+sql+"\n");

  inquireStudent(req, res, next, id, role); 
}

/*
 * SELECT {*}
 * FROM Student
 * WHERE StdSSN = {id};
 * 
 * Set req.app.locals.stdDetails to all the details about a given student.
 */
function inquireStudent(req, res, next, id, role) {
  if (req.body.id) {
    // This is all the columns in the Student table.  The column names are
    // specified explicitly in the SQL to control the order of the columns
    // in the result.
    sql = 'select StdSSN, StdFirstName, StdLastName, StdCity, StdState, StdMajor, StdClass, StdGPA, StdZip';
    sql += ' from Student where StdSSN = ';
    sql += id;
    sql += ';';
    req.app.locals.db.get(sql, [req.body.id], (err, row) => {
      if (err) {
        throw err;
      }
      req.app.locals.stdDetails = row;
    });
  }
  else {
    req.app.locals.stdDetails = undefined;
  }

  console.log("\ninquireStudent, sql: "+sql+"\n");

  studentEnrolled(req, res, next, id, role);
}

/* 
 *
 * SELECT CourseNo, OffTerm, OffYear, FacFirstName, FacLastName, EnrGrade 
 * FROM Enrollment natural join Course natural join Offering natural join Faculty 
 * WHERE StdSSN = {id};
 * 
 * Set req.app.locals.stdEnrolled to a list of pertinent information about the courses a given student is enrolled in.
 */
function studentEnrolled(req, res, next, id, role) {
  if (req.app.locals.stdDetails != undefined) {
    sql = 'SELECT CourseNo, OffTerm, OffYear, FacFirstName, FacLastName, EnrGrade';
    sql += ' FROM Enrollment natural join Course natural join Offering natural join Faculty';
    sql += ' WHERE StdSSN = '
    sql += id;
    sql += ';';
    req.app.locals.db.get(sql, [req.body.id], (err, row) => {
      if (err) {
        throw err;
      }
      req.app.locals.stdEnrolled = row;
    });
  }
  else {
    req.app.locals.stdEnrolled = undefined;
  }

  console.log("\nstudentEnrolled, sql: "+sql+"\n");

  renderPage(req, res, next, id, role);
}

/*
 * Marshal all the data that has been stashed in req.app.locals, and call res.render
 * depending on what role was selected in index.
 */
function renderPage(req, res, next, id, role) {
  console.log('\nrenderPage() called. role: '+JSON.stringify(req.query))
  if (req.body.role === "student") {
    console.log('Rendering Student Page...\n')
    res.render('student', { id, // input value from index
                            formdata: req.body,
                            stdDetails: req.app.locals.stdDetails, // from inquireStudent()
                            enrollment: req.app.locals.stdEnrolled, // from studentEnrolled()
                            WinterOfferings: req.app.locals.WinterOfferings // from listWinterOfferings()
     });
  } else if (req.body.role === "teacher") {
    console.log('Rendering Teacher Page...\n')
    res.render('teacher', { id, // input value from index
                            formdata: req.body,
                            facDetails: req.app.locals.facDetails, // from inquireFaculty()
                            coursesTeaching: req.app.locals.facTeaching, // from teacherTeaching()
                            stdInfo: req.app.locals.teacherGrading // from teacherGrading()
     });
  } else if (req.body.role === "registrar") {
    console.log('Rendering Registrar Page...\n')
    res.render('registrar', { id, // input value from index
                              formdata: req.body,
                              WinterOfferings: req.app.locals.WinterOfferings // from listWinterOfferings()
     });
  } else {
    res.send('Invalid role');
  }
}

module.exports = router;
