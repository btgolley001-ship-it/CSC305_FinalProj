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
  
  var id = req.body.id;

  console.log('req.body.id: '+JSON.stringify(req.body.id)
              +'\nid: '+JSON.stringify(id)+'\n')

  changedb(req, res, next, id);
});

/*
 * If there is a query to run to change the database, run it.
 * In any case, run listWinterOfferings next.
 */
function changedb(req, res, next, id) {
  
  // check if there is an action to take
  if (req.body.action) {
    
    let sql = 'SELECT 3+2;';  // Do something harmless if sql doesn't get set properly
    console.log(sql);

    /*
     * course_add
     * from student.pug
     * 
     * INSERT INTO Enrollment(OfferNo, StdSSN) VALUES({OfferNo_toadd}, {id});
     */

    if (req.body.action == 'course_add') {
      sql = 'INSERT INTO Enrollment(OfferNo, StdSSN) VALUES (';
      sql += `'${req.body.OfferNo_toadd}', `;
      sql += `'${id}');`;
    }

    /*
     * course_drop
     * from student.pug
     * 
     * DELETE FROM Enrollment WHERE StdSSN = '{StdSNN}' and OfferNo = '{OfferNo_todrop}'
     */

    else if (req.body.action == 'course_drop') {
      sql = `DELETE FROM Enrollment WHERE StdSSN='${id}' and OfferNo=`;
      sql += `'${req.body.OfferNo_todrop}';`;
    }

    /* 
     * student_grade
     * from teacher.pug
     * 
     * UPDATE Enrollment SET EnrGrade = {EnrGrade} WHERE StdSSN = {StdSSN} and OfferNo = {OfferNo};
     */

    if (req.body.action == 'student_grade') {
      sql = `UPDATE Enrollment SET EnrGrade = '${req.body.student_grade}'`;
      sql += ` WHERE StdSSN = '${req.body.student_ssn}'`;
      sql += ` and OfferNo = '${req.body.course_to_grade}';`;
    }

    /*
     * offering_add
     * from registrar.pug
     * 
     * INSERT INTO Offering(OfferNo, CourseNo, OffTerm, OffYear, OffDays, OffTime, OffLocation, FacSSN)
     * VALUES ({OfferNo_toAdd}, {CourseNo_toAdd}, 'WINTER', 2025, {Days_toAdd}, {Time_toAdd}, {Location_toAdd}, {FacSSN_toAdd});
     */

    if (req.body.action == 'offering_add') {

      fields = ['OfferNo', 'CourseNo', 'OffTerm', 'OffYear', 'OffLocation', 'OffTime', 'FacSSN', 'OffDays'];
      fields_to_add = [req.body.OfferNo_toAdd, req.body.CourseNo_toAdd, 'WINTER', '2025', req.body.Location_toAdd, req.body.Time_toAdd, req.body.FacSSN_toAdd, req.body.Days_toAdd];

      sql = 'INSERT INTO Offering(';
      for (field of fields) {
        sql += `${field}, `;
      sql = sql.slice(0, -2) + ') VALUES (';
      
      for (field_to_add of fields_to_add) {
        sql += `'${field_to_add}', `;
      }
      sql = sql.slice(0, -2) + ');';
      }
    }

    /*
     * offering_update
     * from registrar.pug
     * 
     * DELETE FROM Offering WHERE OfferNo={OfferNo_toCancel};
     * 
     * OR
     * 
     * UPDATE Offering SET 
     *   FacSSN={FacSSN}, 
     *   OffLocation={Location_toUpdate}, 
     *   OffTime={Time_toUpdate}, OffDays={Days_toUpdate} 
     * WHERE OfferNo={OfferNo_toUpdate};
     */

    else if (req.body.action == 'offering_update') {
      // if Offered checkbox is not checked, delete the offering
      //    (treating missing req.body.Offered as 'delete')
      // else, update the offering with the provided details
      if (!req.body.Offered) {
        sql = `DELETE FROM Offering WHERE OfferNo='${req.body.OfferNo_toUpdate}';`;
      } else {
        sql = `UPDATE Offering SET `;
        sql += `FacSSN='${req.body.FacSSN}', `;
        sql += `OffLocation='${req.body.Location_toUpdate}', `;
        sql += `OffTime='${req.body.Time_toUpdate}', `;
        sql += `OffDays='${req.body.Days_toUpdate}' `;
        sql += `WHERE OfferNo='${req.body.OfferNo_toUpdate}';`;
      }
    }

    console.log("\nchangedb, sql: "+sql+"\n");

    // Callback function defined in the old style so that this.changes gets the
    //     number of rows affected.
    function sqlCallback(err) {
      if (err) throw err;
      console.log(`${this.changes} rows affected.`)
      listWinterOfferings(req, res, next, id);
    }

    req.app.locals.db.run(sql, [], sqlCallback);
  }
  
  // no action to take; just continue
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

    sql = "SELECT OfferNo, CourseNo, (FacFirstName || ' ' || FacLastName) as 'Instructor',"
    sql += " OffLocation as 'Location',"
    sql += " OffTime as 'Time', OffDays as 'Days'"
    sql += " FROM Offering"
    sql += " LEFT OUTER JOIN Faculty ON Offering.FacSSN = Faculty.FacSSN"
    sql += " WHERE OffTerm = 'WINTER' and OffYear = 2025;"

    // SELECT CourseNo, 
    //        (FacFirstName || ' ' || FacLastName) as 'Instructor',
    //        OffLocation as 'Location', 
    //        OffTime as 'Time', OffDays as 'Days'
    // FROM Offering
    // LEFT OUTER JOIN Faculty ON Offering.FacSSN = Faculty.FacSSN
    // WHERE OffTerm = 'WINTER' and OffYear = 2025;
  }
  
  if (req.body.role == 'registrar') {

    sql = "SELECT OfferNo, CourseNo,"
    sql += " (FacFirstName || ' ' || FacLastName) as 'Instructor',"
    sql += " OffLocation as 'Location',"
    sql += " OffTime as 'Time', OffDays as 'Days'"
    sql += " FROM Offering"
    sql += " LEFT OUTER JOIN Faculty ON Offering.FacSSN = Faculty.FacSSN"
    sql += " WHERE OffTerm = 'WINTER' and OffYear = 2025;"

    // SELECT OfferNo, CourseNo, 
    //        (FacFirstName || " " || FacLastName) as "Instructor",
    //        OffLocation as 'Location', 
    //        OffTime as 'Time', OffDays as 'Days'
    // FROM Offering
    // LEFT OUTER JOIN Faculty ON Offering.FacSSN = Faculty.FacSSN
    // WHERE OffTerm = 'WINTER' and OffYear = 2025;
  }

  console.log("\n/---/\nlistWinterOfferings\n   sql: "+sql+"");

  req.app.locals.db.all(sql, [], (err, rows) => {
      if (err) throw err;
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
      if (err) throw err;
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
      if (err) throw err;
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
      if (err) throw err;
      req.app.locals.courses = rows;
      // log output for debugging
      console.log("\n/---/\nlistCourses\n   courses (from callback): ", rows, "\n/---/");
      // continue after getting courses

      // Depending on role, inquire about faculty or student next (role-based inquiries)
      //    student -> inquireStudent()
      //    faculty -> inquireFaculty()
      //    registrar -> renderPage(); need no further inquiries
      if (req.body.role === 'student') {
        inquireStudent(req, res, next, id);
      }
      else if (req.body.role === 'teacher') {
        inquireFaculty(req, res, next, id);
      }
      else {
        renderPage(req, res, next, id);
      }
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
    let sql = 'SELECT 3+2;';  // if sql doesn't get set properly

    // This is all the columns in the Faculty table.  The column names are
    // specified explicitly in the SQL to control the order of the columns
    // in the result.
    sql = 'SELECT FacSSN, FacFirstName, FacLastName, FacCity, FacState, FacZipCode, FacDept, FacRank, FacSalary, FacSupervisor, FacHireDate';
    sql += ' FROM Faculty';
    sql += ' WHERE FacSSN = ?;';

    req.app.locals.db.all(sql, [id], (err, row) => {
      if (err) throw err;
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
    let sql = 'SELECT 3+2;';  // if sql doesn't get set properly

    sql = 'SELECT CourseNo, OffTerm, OffYear';
    sql += ' FROM Offering';
    sql += ' WHERE FacSSN = ?;';
    req.app.locals.db.all(sql, [id], (err, rows) => {
      if (err) throw err;
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
 * FROM Offering NATURAL JOIN Enrollment NATURAL JOIN Student
 * WHERE CourseNo = {CourseNo};
 * 
 * Set req.app.locals.teacherGrading to the information needed for the view of the table when editing grades.
 * Run inquireStudent() next.
 */
function findTeacherGrading(req, res, next, id) {
  if (req.body.course_to_grade) {
    let sql = 'SELECT 3+2;';  // if sql doesn't get set properly

    sql = 'SELECT (StdFirstName || " " || StdLastName) as "Student", Student.StdSSN as StdSSN, EnrGrade as "Grade"';
    sql += ' FROM Offering NATURAL JOIN Enrollment NATURAL JOIN Student';
    sql += ' WHERE CourseNo = ?;';
    req.app.locals.db.all(sql, [req.body.course_to_grade], (err, rows) => { // course_to_grade TBA, from teacher.pug form
      if (err) throw err;
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
    let sql = 'SELECT 3+2;';  // if sql doesn't get set properly

    // This is all the columns in the Student table.  The column names are
    // specified explicitly in the SQL to control the order of the columns
    // in the result.
    sql = 'SELECT StdSSN, StdFirstName, StdLastName, StdCity, StdState, StdZip, StdMajor, StdClass, StdGPA';
    sql += ' FROM Student WHERE StdSSN = ?;';
    req.app.locals.db.all(sql, [id], (err, row) => {
      if (err) throw err;
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
 * SELECT CourseNo, OffTerm as "Term", OffYear as "Year", 
 * (FacFirstName || " " || FacLastName) as "Instructor",
 * EnrGrade as "Grade"
 * FROM Enrollment natural join Course natural join Offering natural join Faculty 
 * WHERE StdSSN = {id};
 * 
 * Set req.app.locals.stdEnrolled to a list of pertinent information about the courses a given student is enrolled in.
 */
function studentEnrolled(req, res, next, id) {
  if (req.app.locals.stdDetails != undefined) {
    let sql = 'SELECT 3+2;';  // if sql doesn't get set properly
    
    sql = 'SELECT CourseNo, OffTerm as "Term", OffYear as "Year", (FacFirstName || " " || FacLastName) as "Instructor", EnrGrade as "Grade"';
    sql += ' FROM Enrollment natural join Course natural join Offering natural join Faculty';
    sql += ' WHERE StdSSN = ?;';

    req.app.locals.db.all(sql, [id], (err, rows) => {
      if (err) throw err;
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