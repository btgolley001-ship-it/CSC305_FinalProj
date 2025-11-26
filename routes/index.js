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
              +'\nid: '+JSON.stringify(id)+'\n')

  changeEnrollment(req, res, next, id);
});

/*
 * If there is a query to run to change the Enrollment table, run it.
 * In any case, run listWinterOfferings next.
 */
function changeEnrollment(req, res, next, id) { // REMINDER: need to fix up this code!
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
      sql += `) VALUES ('${id}'`;
      for (field of fields) {
        sql += `,'${req.body[field]}'`;
      }
      sql += ');';
      // INSERT INTO Enrollment(StdSSN, OfferNo, EnrGrade) VALUES({id}, {OfferNo}, {EnrGrade});
    }
    
    // course_drop
    
    else if (req.body.action == 'course_drop') {
      sql = `DELETE * FROM Enrollment WHERE StdSSN='${id}' and OfferNo=`;
      sql += `,'${req.body.OfferNo}'`;
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
      listWinterOfferings(req, res, next, id);
    }

    req.app.locals.db.run(sql, [], sqlCallback);
  }

  // teacher.pug changes

  else if (req.body.action && req.body.role === 'teacher') {
    let sql = 'SELECT 3+2;';  // Do something harmless if sql doesn't get set properly
    console.log(sql);

    // student_grade

    if (req.body.action == 'course_drop') {
      sql = `UPDATE Enrollment SET EnrGrade = '${req.body.EnrGrade}'`;
      update_fields = fields.slice(3,7).concat(['FacSupervisor','FacZipCode']);
      sql += ` WHERE StdSSN = '${req.body.StdSSN}';`;
      sql += ` and OfferNo = '${req.body.OfferNo}';`;
      // UPDATE Enrollment SET EnrGrade = {EnrGrade} WHERE StdSSN = {StdSSN} and OfferNo = {OfferNo};
    }

    console.log("\nchangeEnrollment, if role = 'teacher', sql: "+sql+"\n");

    // Callback function defined in the old style so that this.changes gets the
    //     number of rows affected.
    function sqlCallback(err) {
      if (err) {
        throw err;
      }
      console.log(`${this.changes} rows affected.`)
      listWinterOfferings(req, res, next, id);
    }

    req.app.locals.db.run(sql, [], sqlCallback);
  }

  else {
    listWinterOfferings(req, res, next, id);
  }
}

/*
 * default:
 * SELECT OfferNo, CourseNo, OffTerm, OffYear, OffDays, OffTime, OffLocation, FacSSN 
 * FROM Offering 
 * WHERE OffTerm = 'WINTER' and OffYear = 2025;
 *
 * Set req.app.locals.WinterOfferings to a list of the courses offered in Winter 2025.
 * Run inquireFaculty() next.
 */
function listWinterOfferings(req, res, next, id) {
  // This is all the columns in the Offering table.  The column names are
  // specified explicitly in the SQL to control the order of the columns
  // in the result.
  let sql = "SELECT OfferNo, CourseNo, OffTerm, OffYear, OffDays, OffTime, OffLocation, FacSSN FROM Offering WHERE OffTerm = 'WINTER' and OffYear = 2025;";
  
  if (req.body.role == 'student') {

    sql = "SELECT CourseNo as 'Course Number', (FacFirstName || ' ' || FacLastName) as 'Instructor',"
    sql += " OffLocation as 'Location',"
    sql += " OffTime as 'Time', OffDays as 'Days'"
    sql += " FROM Offering natural join Faculty"
    sql += " WHERE OffTerm = 'WINTER' and OffYear = 2025;"

    // SELECT CourseNo as 'Course Number', 
    //        (FacFirstName || ' ' || FacLastName) as 'Instructor',
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
    //        (FacFirstName || " " || FacLastName) as "Instructor",
    //        OffLocation as 'Location', 
    //        OffTime as 'Time', OffDays as 'Days'
    // FROM Offering natural join Faculty
    // WHERE OffTerm = 'WINTER' and OffYear = 2025;
  }

  console.log("\n/---/\nlistWinterOfferings\n   sql: "+sql+"");

  req.app.locals.db.get(sql, [], (err, rows) => {
      if (err) {
        throw err;
      }
      req.app.locals.WinterOfferings = rows;
    });

  console.log("   WinterOfferings: "+req.app.locals.WinterOfferings+"\n/---/");

  inquireFaculty(req, res, next, id);
}

/*
 * SELECT {*}
 * FROM Faculty
 * WHERE FacSSN = {id};
 *
 * Set req.app.locals.facDetails to all the details about a given faculty member.
 * Run teacherTeaching() next.
 */
function inquireFaculty(req, res, next, id) {
  if (req.body.id) {
    // This is all the columns in the Faculty table.  The column names are
    // specified explicitly in the SQL to control the order of the columns
    // in the result.
    sql = 'SELECT FacSSN, FacFirstName, FacLastName, FacCity, FacState, FacZipCode, FacDept, FacRank, FacSalary, FacSupervisor, FacHireDate';
    sql += ' FROM Faculty WHERE FacSSN = ';
    sql += id;
    sql += ';';

    req.app.locals.db.all(sql, [id], (err, row) => {
      if (err) {
        throw err;
      }
      req.app.locals.facDetails = row;
    });
  }
  else {
    req.app.locals.facDetails = undefined;
  }

  console.log("\n/---/\ninquireFaculty\n   sql: "+sql+"\n   facDetails: "+req.app.locals.facDetails+"\n/---/");

  teacherTeaching(req, res, next, id);
}

/*
 * SELECT CourseNo, OffTerm, OffYear 
 * FROM Offering 
 * WHERE FacSSN = {id};
 *
 * Set req.app.locals.facTeaching to information about the courses a teacher is associated with.
 * Run teacherGrading() next.
 */
function teacherTeaching(req, res, next, id) {
  if (req.body.id) {
    sql = 'SELECT CourseNo, OffTerm, OffYear';
    sql += ' FROM Offering';
    sql += ' WHERE FacSSN = '
    sql += id;
    sql += ';';
    req.app.locals.db.all(sql, [id], (err, row) => {
      if (err) {
        throw err;
      }
      req.app.locals.facTeaching = row;
    });
  }
  else {
    req.app.locals.facTeaching = undefined;
  }

  console.log("\n/---/\nteacherTeaching\n   sql: "+sql+"\n   facTeaching: "+req.app.locals.facTeaching+"\n/---/");

  teacherGrading(req, res, next, id); 
}

/*
 * SELECT (StdFirstName || " " || StdLastName) as "Student",
 *         StdSSN as "Student ID", EnrGrade as "Grade"
 * FROM Student natural join Enrollment natural join Offering
 * WHERE OfferNo = {OfferNo} and FacSSN = {id};
 * 
 * Set req.app.locals.teacherGrading to the information needed for the view of the table when editing grades.
 * Run inquireStudent() next.
 */
function teacherGrading(req, res, next, id) {
  if (req.body.id) {
    sql = 'SELECT (StdFirstName || " " || StdLastName) as "Student", StdSSN as "Student ID", EnrGrade as "Grade"';
    sql += ' FROM Student natural join Enrollment natural join Offering';
    sql += ' WHERE OfferNo = '
    sql += req.body.course_to_grade; // input TBA in teacher.pug
    sql += ' and FacSSN = '
    sql += id;
    sql += ';';
    req.app.locals.db.all(sql, [req.body.course_to_grade, id], (err, rows) => {
      if (err) {
        throw err;
      }
      req.app.locals.teacherGrading = rows;
    });
  }
  else {
    req.app.locals.teacherGrading = undefined;
  }

  console.log("\n/---/\nteacherGrading\n   sql: "+sql+"\n   teacherGrading: "+req.app.locals.teacherGrading+"\n/---/");

  inquireStudent(req, res, next, id); 
}

/*
 * SELECT {*}
 * FROM Student
 * WHERE StdSSN = {id};
 * 
 * Set req.app.locals.stdDetails to all the details about a given student.
 */
function inquireStudent(req, res, next, id) {
  if (req.body.id) {
    // This is all the columns in the Student table.  The column names are
    // specified explicitly in the SQL to control the order of the columns
    // in the result.
    sql = 'SELECT StdSSN, StdFirstName, StdLastName, StdCity, StdState, StdZip, StdMajor, StdClass, StdGPA';
    sql += ' FROM Student WHERE StdSSN = ';
    sql += id;
    sql += ';';
    req.app.locals.db.all(sql, [id], (err, row) => {
      if (err) {
        throw err;
      }
      req.app.locals.stdDetails = row;
    });
  }
  else {
    req.app.locals.stdDetails = undefined;
  }

  console.log("\n/---/\ninquireStudent\n   sql: "+sql+"\n   stdDetails: "+req.app.locals.stdDetails+"\n/---/");

  studentEnrolled(req, res, next, id);
}

/* 
 *
 * SELECT CourseNo as "Course Number", OffTerm as "Term", OffYear as "Year", 
 * (FacFirstName || " " || FacLastName) as "Instructor",
 * EnrGrade as "Grade"
 * FROM Enrollment natural join Course natural join Offering natural join Faculty 
 * WHERE StdSSN = {id};
 * 
 * Set req.app.locals.stdEnrolled to a list of pertinent information about the courses a given student is enrolled in.
 */
function studentEnrolled(req, res, next, id) {
  if (req.app.locals.stdDetails != undefined) {
    sql = 'SELECT CourseNo as "Course Number", OffTerm as "Term", OffYear as "Year", (FacFirstName || " " || FacLastName) as "Instructor", EnrGrade as "Grade"';
    sql += ' FROM Enrollment natural join Course natural join Offering natural join Faculty';
    sql += ' WHERE StdSSN = '
    sql += id;
    sql += ';';
    req.app.locals.db.all(sql, [id], (err, rows) => {
      if (err) {
        throw err;
      }
      req.app.locals.stdEnrolled = rows;
    });
  }
  else {
    req.app.locals.stdEnrolled = undefined;
  }

  console.log("\n/---/\nstudentEnrolled\n   sql: "+sql+"\n   stdEnrolled: "+req.app.locals.stdEnrolled+"\n/---/");

  renderPage(req, res, next, id);
}

/*
 * Marshal all the data that has been stashed in req.app.locals, and call res.render
 * depending on what role was selected in index.
 */
function renderPage(req, res, next, id) {
  console.log('\nrenderPage() called. role: '+JSON.stringify(req.body.role))
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
