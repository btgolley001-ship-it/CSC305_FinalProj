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
 * In any case, run changeOffering next.
 */
function changeEnrollment(req, res, next, id) { // REMINDER: need to fix up this code!
  console.log(`changeEnrollment: ${req.body.action}`);

  // student.pug changes

  if (req.body.action && req.body.role === 'student') {
    let sql = 'SELECT 3+2;';  // Do something harmless if sql doesn't get set properly
    
    // course_add

    if (req.body.action == 'course_add') {
      sql = 'INSERT INTO Enrollment(OfferNo, StdSSN) VALUES (';
      sql += `'${req.body.OfferNo_toadd}', `;
      sql += `'${id}');`;
      // INSERT INTO Enrollment(OfferNo, StdSSN) VALUES({OfferNo_toadd}, {id});
    }
    
    // course_drop
    
    else if (req.body.action == 'course_drop') {
      sql = `DELETE FROM Enrollment WHERE StdSSN='${id}' and OfferNo=`;
      sql += `'${req.body.OfferNo_todrop}';`;
      // DELETE FROM Enrollment WHERE StdSSN = '{StdSNN}' and OfferNo = '{OfferNo_todrop}'
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

    if (req.body.action == 'student_grade') {
      sql = `UPDATE Enrollment SET EnrGrade = '${req.body.student_grade}'`;
      sql += ` WHERE StdSSN = '${req.body.student_ssn}';`;
      sql += ` and OfferNo = '${req.body.course_to_grade}';`;
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
      changeOffering(req, res, next, id);
    }

    req.app.locals.db.run(sql, [], sqlCallback);
  }

  else {
    changeOffering(req, res, next, id);
  }
}

/*
 * If there is a query to run to change the Enrollment table, run it.
 * In any case, run listWinterOfferings next.
 */
function changeOffering(req, res, next, id) {
  if (req.body.action && req.body.role === 'registrar') {
    let sql = 'SELECT 3+2;';  // Do something harmless if sql doesn't get set properly
    console.log(sql);

    // offering_add

    if (req.body.action == 'offering_add') {

      fields = ['OfferNo', 'CourseNo', 'OffTerm', 'OffYear', 'OffLocation', 'OffTime', 'FacSSN', 'OffDays'];
      fields_to_add = [req.body.OfferNo_toAdd, req.body.CourseNo_toAdd, 'WINTER', '2025', req.body.Location_toAdd, req.body.Time_toAdd, req.body.FacSSN_toAdd, req.body.Days_toAdd];

      sql = 'INSERT INTO Offering(';
      for (field of fields) {
        sql += `${field}, `;
      sql = sql.slice(0, -2) + ') VALUES (';
      // INSERT INTO Offering(OfferNo, CourseNo, OffTerm, OffYear, OffDays, OffTime, OffLocation, FacSSN)
      
      for (field_to_add of fields_to_add) {
        sql += `'${field_to_add}', `;
      }
      sql = sql.slice(0, -2) + ');';
      // VALUES ({OfferNo_toAdd}, {CourseNo_toAdd}, 'WINTER', 2025, {Days_toAdd}, {Time_toAdd}, {Location_toAdd}, {FacSSN_toAdd});
      }
    }
    
    // offering_update

    else if (req.body.action == 'offering_update') {
      
      sql = `UPDATE Offering SET `;
      sql += `FacSSN='${req.body.FacSSN}', `;
      sql += `OffLocation='${req.body.Location_toUpdate}', `;
      sql += `OffTime='${req.body.Time_toUpdate}', `;
      sql += `OffDays='${req.body.Days_toUpdate}' `;
      sql += `WHERE OfferNo='${req.body.OfferNo_toUpdate}';`;
      // UPDATE Offering SET 
        // FacSSN={FacSSN}, 
        // OffLocation={Location_toUpdate}, 
        // OffTime={Time_toUpdate}, OffDays={Days_toUpdate} 
      // WHERE OfferNo={OfferNo_toUpdate};

    }

    // offering_cancel

    else if (req.body.action == 'offering_cancel') {
      sql = `DELETE FROM Offering WHERE OfferNo = '${req.body.OfferNo_toCancel}';`;
    }

    console.log("\nchangeOffering, if role = 'registrar', sql: "+sql+"\n");

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
 * Run listStudentIDs() next.
 */
function listWinterOfferings(req, res, next, id) {
  // This is all the columns in the Offering table.  The column names are
  // specified explicitly in the SQL to control the order of the columns
  // in the result.
  let sql = "SELECT OfferNo, CourseNo, OffTerm, OffYear, OffDays, OffTime, OffLocation, FacSSN FROM Offering WHERE OffTerm = 'WINTER' and OffYear = 2025;";
  
  if (req.body.role == 'student') {

    sql = "SELECT CourseNo, (FacFirstName || ' ' || FacLastName) as 'Instructor',"
    sql += " OffLocation as 'Location',"
    sql += " OffTime as 'Time', OffDays as 'Days'"
    sql += " FROM Offering natural join Faculty"
    sql += " WHERE OffTerm = 'WINTER' and OffYear = 2025;"

    // SELECT CourseNo, 
    //        (FacFirstName || ' ' || FacLastName) as 'Instructor',
    //        OffLocation as 'Location', 
    //        OffTime as 'Time', OffDays as 'Days'
    // FROM Offering natural join Faculty
    // WHERE OffTerm = 'WINTER' and OffYear = 2025;
  }
  
  if (req.body.role == 'registrar') {

    sql = "SELECT OfferNo, CourseNo,"
    sql += " FacFirstName, FacLastName,"
    sql += " OffLocation as 'Location',"
    sql += " OffTime as 'Time', OffDays as 'Days'"
    sql += " FROM Offering natural join Faculty"
    sql += " WHERE OffTerm = 'WINTER' and OffYear = 2025;"

    // SELECT OfferNo, CourseNo, 
    //        (FacFirstName || " " || FacLastName) as "Instructor",
    //        OffLocation as 'Location', 
    //        OffTime as 'Time', OffDays as 'Days'
    // FROM Offering natural join Faculty
    // WHERE OffTerm = 'WINTER' and OffYear = 2025;
  }

  console.log("\n/---/\nlistWinterOfferings\n   sql: "+sql+"");

  req.app.locals.db.all(sql, [], (err, rows) => {
      if (err) {
        throw err;
      }
      req.app.locals.WinterOfferings = rows;
      // log output for debugging
      console.log("   WinterOfferings (from callback): ", rows, "\n/---/");
      // continue after getting WinterOfferings
      listStudentIDs(req, res, next, id);
    });
}

/*
 * SELECT StdSSN, (StdFirstName || ' ' || StdLastName) as 'Student'
 * FROM Student
 * ORDER BY StdSSN;
 * 
 * Unconditionally set req.app.locals.studentIDs to a list of all student IDs.
 * Run listFacultyIDs() next.
 */
function listStudentIDs(req, res, next, id) {
  let sql = "SELECT StdSSN, (StdFirstName || ' ' || StdLastName) as 'Student' FROM Student ORDER BY StdSSN;";
  req.app.locals.db.all(sql, [], (err, rows) => {
      if (err) {
        throw err;
      }
      req.app.locals.studentIDs = rows;
      // log output for debugging
      console.log("\n/---/\nlistStudentIDs\n   studentIDs (from callback): ", rows, "\n/---/");
      // continue after getting studentIDs
      listFacultyIDs(req, res, next, id);
    });
}

/*
 * SELECT FacSSN, (FacFirstName || ' ' || FacLastName) as 'Instructor'
 * FROM Faculty;
 * ORDER BY FacSSN;
 * 
 * Unconditionally set req.app.locals.facultyIDs to a list of all faculty IDs.
 * Run listCourses() next.
 */
function listFacultyIDs(req, res, next, id) {
  let sql = "SELECT FacSSN, (FacFirstName || ' ' || FacLastName) as 'Instructor' FROM Faculty ORDER BY FacSSN;";
  req.app.locals.db.all(sql, [], (err, rows) => {
      if (err) {
        throw err;
      }
      req.app.locals.facultyIDs = rows;
      // log output for debugging
      console.log("\n/---/\nlistFacultyIDs\n   facultyIDs (from callback): ", rows, "\n/---/");
      // continue after getting facultyIDs
      listCourses(req, res, next, id);
    });
}

/*
 * SELECT CourseNo, CrsDesc, CrsUnits
 * FROM Course
 * ORDER BY CourseNo;
 * 
 * Unconditionally set req.app.locals.courses to the entire Course table.
 * Run inquireFaculty() next.
 */
function listCourses(req, res, next, id) {
  let sql = "SELECT CourseNo, CrsDesc, CrsUnits FROM Course ORDER BY CourseNo;";
  req.app.locals.db.all(sql, [], (err, rows) => {
      if (err) {
        throw err;
      }
      req.app.locals.courses = rows;
      // log output for debugging
      console.log("\n/---/\nlistCourses\n   courses (from callback): ", rows, "\n/---/");
      // continue after getting courses
      inquireFaculty(req, res, next, id);
    });
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
  // Check that the given id is in the list of faculty IDs. If not, skip the query.
  const idStr = String(id);
  const facultyIDs = (req.app.locals.facultyIDs || []).map(obj => String(obj.FacSSN));
  if (facultyIDs.includes(idStr)) {
    // This is all the columns in the Faculty table.  The column names are
    // specified explicitly in the SQL to control the order of the columns
    // in the result.
    sql = 'SELECT FacSSN, FacFirstName, FacLastName, FacCity, FacState, FacZipCode, FacDept, FacRank, FacSalary, FacSupervisor, FacHireDate';
    sql += ' FROM Faculty ';
    sql += ' WHERE FacSSN = ?;';

    req.app.locals.db.all(sql, [id], (err, row) => {
      if (err) {
        throw err;
      }
      req.app.locals.facDetails = row;
      // log output for debugging
      console.log("\n/---/\ninquireFaculty (callback)\n   sql: "+sql+"\n   facDetails: ", row, "\n/---/");
      // continue after getting facDetails
      teacherTeaching(req, res, next, id);
    });
  }
  else {
    req.app.locals.facDetails = undefined;
    teacherTeaching(req, res, next, id);
  }
}

/*
 * SELECT CourseNo, OffTerm, OffYear 
 * FROM Offering 
 * WHERE FacSSN = {id};
 *
 * Set req.app.locals.facTeaching to information about the courses a teacher is associated with.
 * Run findTeacherGrading() next.
 */
function teacherTeaching(req, res, next, id) {
  if (req.app.locals.facDetails != undefined) {
    sql = 'SELECT CourseNo, OffTerm, OffYear';
    sql += ' FROM Offering';
    sql += ' WHERE FacSSN = ?;';
    req.app.locals.db.all(sql, [id], (err, rows) => {
      if (err) {
        throw err;
      }
      req.app.locals.facTeaching = rows;
      // log output for debugging
      console.log("\n/---/\nteacherTeaching\n   sql: "+sql+"\n   facTeaching: ", rows, "\n/---/");
      // continue after getting facTeaching
      findTeacherGrading(req, res, next, id); 
    });
  }
  else {
    req.app.locals.facTeaching = undefined;
    findTeacherGrading(req, res, next, id); 
  }
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
function findTeacherGrading(req, res, next, id) {
  if (req.app.locals.facDetails != undefined && req.body.course_to_grade) {
    sql = 'SELECT (StdFirstName || " " || StdLastName) as "Student", StdSSN, EnrGrade as "Grade"';
    sql += ' FROM Student natural join Enrollment natural join Offering';
    sql += ' WHERE OfferNo = ?';
    sql += ' and FacSSN = ?;';
    req.app.locals.db.all(sql, [req.body.course_to_grade, id], (err, rows) => { // course_to_grade TBA, from teacher.pug form
      if (err) {
        throw err;
      }
      req.app.locals.teacherGrading = rows;
      // log output for debugging
      console.log("\n/---/\nfindTeacherGrading\n   sql: "+sql+"\n   teacherGrading: ", rows, "\n/---/");
      // continue after getting teacherGrading
      inquireStudent(req, res, next, id); 
    });
  }
  else {
    req.app.locals.teacherGrading = undefined;
    inquireStudent(req, res, next, id); 
  }
}

/*
 * SELECT {*}
 * FROM Student
 * WHERE StdSSN = {id};
 * 
 * Set req.app.locals.stdDetails to all the details about a given student.
 */
function inquireStudent(req, res, next, id) {
  // Check that the given id is in the list of student IDs. If not, skip the query.
  const idStr = String(id);
  const studentIDs = (req.app.locals.studentIDs || []).map(obj => String(obj.StdSSN));
  if (studentIDs.includes(idStr)) {    
    // This is all the columns in the Student table.  The column names are
    // specified explicitly in the SQL to control the order of the columns
    // in the result.
    sql = 'SELECT StdSSN, StdFirstName, StdLastName, StdCity, StdState, StdZip, StdMajor, StdClass, StdGPA';
    sql += ' FROM Student WHERE StdSSN = ?;';
    req.app.locals.db.all(sql, [id], (err, row) => {
      if (err) {
        throw err;
      }
      req.app.locals.stdDetails = row;
      // log output for debugging
      console.log("\n/---/\ninquireStudent (callback)\n   sql: "+sql+"\n   stdDetails: ", row, "\n/---/");
      // continue after getting stdDetails
      studentEnrolled(req, res, next, id);
    });
  }
  else {
    req.app.locals.stdDetails = undefined;
    studentEnrolled(req, res, next, id);
  }
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
      // log output for debugging
      console.log("\n/---/\nstudentEnrolled\n   sql: "+sql+"\n   stdEnrolled: ", rows, "\n/---/");
      // continue after getting stdEnrolled
      renderPage(req, res, next, id);
    });
  }
  else {
    req.app.locals.stdEnrolled = undefined;
    renderPage(req, res, next, id);
  }
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
                            stdInfo: req.app.locals.teacherGrading // from findTeacherGrading()
     });
  } else if (req.body.role === "registrar") {
    console.log('Rendering Registrar Page...\n')
    res.render('registrar', { id, // input value from index
                              formdata: req.body,
                              WinterOfferings: req.app.locals.WinterOfferings, // from listWinterOfferings()
                              studentIDs: req.app.locals.studentIDs, // from listStudentIDs()
                              facultyIDs: req.app.locals.facultyIDs, // from listFacultyIDs()
                              courses: req.app.locals.courses // from listCourses()
     });
  } else {
    res.send('Invalid role');
  }
}

module.exports = router;
