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
   * NEED TO FIX THIS ASAP
   */

  listTerms(req, res, next, id, role);
});


/*
 * Unconditionally set req.app.locals.termslist to be a list of the terms 
 * represented in the Offerings table, and call changeFaculty.
 */
function listTerms(req, res, next, id, role) {
  let sql = 'SELECT distinct OffTerm, OffYear from Offering order by OffYear;'
  req.app.locals.db.all(sql, [], (err, rows) => {
      if (err) {
        throw err;
      }
      req.app.locals.termslist = rows;
      changeFaculty(req, res, next, id, role);
  })
}

/*
 * If there is a query to run to change the Faculty table, run it.
 * In any case, run changeEnrollment next.
 */
function changeFaculty(req, res, next, id, role) {
  console.log(`changeFaculty: ${req.body.action}`);
  if (req.body.action && role === 'teacher') {
    let sql = 'SELECT 3+2;';  // Do something harmless if sql doesn't get set properly
    fields = ['FacFirstName', 'FacLastName', 'FacCity', 'FacState',
              'FacDept', 'FacRank', 'FacSalary', 'FacHireDate', 'FacZipCode'];
    if (req.body.action == 'faculty_insert') {
      sql = 'INSERT INTO FACULTY(FacSSN';
      for (field of fields) {
        sql += `,${field}`;
      }
      if (req.body.FacSupervisor) {
        sql += ',FacSupervisor'
      }
      sql += `) VALUES ('${req.body.FacSSN}'`;
      for (field of fields) {
        sql += `,'${req.body[field]}'`;
      }
      if (req.body.FacSupervisor) {
        sql += `,'${req.body.FacSupervisor}'`;
      }
      sql += ');';
    }
    else if (req.body.action.startsWith('faculty_update_')) {
      if (req.body.FacDelete) {
        sql = `DELETE FROM Faculty WHERE FacSSN='${req.body.FacSSN}';`;
      }
      else {
        sql = `Update Faculty SET FacCity = '${req.body.FacCity}'`;
        update_fields = fields.slice(3,7).concat(['FacSupervisor','FacZipCode']);
        for (field of update_fields) {
          sql += `,${field} = '${req.body[field]}'`;
        }
        sql += ` WHERE FacSSN='${req.body.FacSSN}';`;
      }
    }
    console.log(sql);

    // Callback function defined in the old style so that this.changes gets the
    //     number of rows affected.
    function sqlCallback(err) {
      if (err) {
        throw err;
      }
      console.log(`${this.changes} rows affected.`)
      changeEnrollment(req, res, next, id, role);
    }

    req.app.locals.db.run(sql, [], sqlCallback);
  }
  else {
    changeEnrollment(req, res, next, id, role);
  }
}

/*
 * If there is a query to run to change the Enrollment table (from student.pug), run it.
 * In any case, run getFaculty next.
 */
function changeEnrollment(req, res, next, id, role) {
  console.log(`changeEnrollment: ${req.body.action}`);
  if (req.body.action && role === 'student') {
    let sql = 'SELECT 3+2;';  // Do something harmless if sql doesn't get set properly
    fields = ['OfferNo', 'EnrGrade'];
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
    }
    else if (req.body.action == 'course_drop') {
      sql = `DELETE FROM Enrollment WHERE StdSSN='${req.body.StdSSN}' and OfferNo=`;
      sql += `,'${req.body['OfferNo']}'`;
      sql += ';';
    }
    console.log(sql);

    // Callback function defined in the old style so that this.changes gets the
    //     number of rows affected.
    function sqlCallback(err) {
      if (err) {
        throw err;
      }
      console.log(`${this.changes} rows affected.`)
      getFaculty(req, res, next, id, role);
    }

    req.app.locals.db.run(sql, [], sqlCallback);
  }
  else {
    getFaculty(req, res, next, id, role);
  }
}

/**
 * Unconditionally set req.app.locals.faculty to be a list of the
 * entire Faculty table.  Call getStudent next.
 */
function getFaculty(req, res, next, id, role) {
  let sql = 'SELECT * from Faculty order by FacLastName, FacFirstName, FacSSN;'
  req.app.locals.db.all(sql, [], (err, rows) => {
    if (err) {
      throw err;
    }
    req.app.locals.faculty = rows;
    getStudent(req, res, next, id, role);
  })
}

/**
 * Unconditionally set req.app.locals.students to be a list of the
 * entire Student table.  Call listTerms next.
 */
function getStudent(req, res, next, id, role) {
  let sql = 'SELECT * from Student order by StdLastName, StdFirstName, StdSSN;'
  req.app.locals.db.all(sql, [], (err, rows) => {
    if (err) {
      throw err;
    }
    req.app.locals.student = rows;
    listTermCourses(req, res, next, id, role);
  })
}

/*
 * If req.body.term_year is set, set req.locals.termcourses to a list of the
 * courses offered in that term and year.  Call listFaculty next.
 */
function listTermCourses(req, res, next, id, role) {
  if (req.body.term_year) {
    console.log(`term_year = "${req.body.term_year}"`);
    let parts = req.body.term_year.split('_');
    let term = parts[0];
    let year = parts[1];
    console.log(`term="${term}" year="${year}"`);
    // This is all the columns in the Offering table.  The column names are
    // specified explicitly in the SQL to control the order of the columns
    // in the result.
    let sql = "select OfferNo, CourseNo, OffTerm, OffYear, OffDays, OffTime, OffLocation, FacSSN from Offering where OffTerm=? and OffYear=?;";
    req.app.locals.db.all(sql, [term, year], (err, rows) => {
      req.app.locals.termcourses = rows;
      console.log(`${rows.length} courses`);
      listFaculty(req, res, next, id, role);
    });
  }
  else {
    req.app.locals.termcourses = undefined;
    listFaculty(req, res, next, id, role);
  }
}

/*
 * Unconditionally set req.app.locals.facpeople to the FacSSN, FacFirstName, and
 * FacLastName of everyone in the Faculty table.  Call inquireFaculty.
 */
function listFaculty(req, res, next, id, role) {  
  let sql = 'SELECT FacSSN, FacFirstName, FacLastName from Faculty;'
  req.app.locals.db.all(sql, [], (err, rows) => {
    if (err) {
      throw err;
    }
    req.app.locals.facpeople = rows;
    inquireFaculty(req, res, next, id, role);
  })
}

/*
 * Set req.app.locals.facDetails to all the details about a given faculty member.  Call listStudent.
 */
function inquireFaculty(req, res, next, id, role) {
  if (req.body.FacSSN) {
    sql = 'select FacSSN, FacFirstName, FacLastName, FacCity, FacState, FacZipCode, FacDept, FacRank, FacSalary, FacSupervisor, FacHireDate';
    sql += ' from Faculty where FacSSN=?;';
    req.app.locals.db.get(sql, [req.body.FacSSN], (err, row) => {
      if (err) {
        throw err;
      }
      req.app.locals.facDetails = row;
      listStudent(req, res, next, id, role);
    });
  }
  else {
    req.app.locals.facDetails = undefined;
    listStudent(req, res, next, id, role);
  }
}

/*
 * Unconditionally set req.app.locals.stdpeople to the StdSSN, StdFirstName, and
 * StdLastName of everyone in the Student table.  Call inquireStudent.
 */
function listStudent(req, res, next, id, role) {  
  let sql = 'SELECT StdSSN, StdFirstName, StdLastName from Student;'
  req.app.locals.db.all(sql, [], (err, rows) => {
    if (err) {
      throw err;
    }
    req.app.locals.stdpeople = rows;
    inquireStudent(req, res, next, id, role);
  })
}

/*
 * Set req.app.locals.stdDetails to all the details about a given faculty member.  Call renderPage.
 */
function inquireStudent(req, res, next, id, role) {
  if (req.body.StdSSN) {
    sql = 'select StdSSN, StdFirstName, StdLastName, StdCity, StdState, StdMajor, StdClass, StdGPA, StdZip';
    sql += ' from Student where StdSSN=?;';
    req.app.locals.db.get(sql, [req.body.FacSSN], (err, row) => {
      if (err) {
        throw err;
      }
      req.app.locals.stdDetails = row;
      renderPage(req, res, next, id, role);
    });
  }
  else {
    req.app.locals.stdDetails = undefined;
    renderPage(req, res, next, id, role);
  }
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
                            enrolled: req.app.locals.enrollment,
                            formdata: req.body,
                            termslist: req.app.locals.termslist, // list of terms in Offering table, from listTerms()
                            faculty: req.app.locals.faculty, // entire Faculty table, from getFaculty()
                            student: req.app.locals.student, // entire Student table, from getStudent ()
                            termslist: req.app.locals.termslist,  // list of terms represented in the Offering table, from listTerms()
                            termcourses: req.app.locals.termcourses, // list of courses offered in req.body.term_year, from listTermCourses()
                            facpeople: req.app.locals.facpeople, // list of SSN, first and last names of the Faculty table, from listFaculty()
                            facDetails: req.app.locals.facDetails, // from inquireFaculty
                            stdpeople: req.app.locals.stdpeople, // list of SSN, first and last names of the Student table, from listStudent()
                            stdDetails: req.app.locals.stdDetails // from inquireStudent()
     });
  } else if (req.body.role === "teacher") {
    console.log('Rendering Teacher Page...\n')
    res.render('teacher', { id, // input value from index
                            formdata: req.body,
                            termslist: req.app.locals.termslist, // list of terms in Offering table, from listTerms()
                            faculty: req.app.locals.faculty, // entire Faculty table, from getFaculty()
                            student: req.app.locals.student, // entire Student table, from getStudent ()
                            termslist: req.app.locals.termslist,  // list of terms represented in the Offering table, from listTerms()
                            termcourses: req.app.locals.termcourses, // list of courses offered in req.body.term_year, from listTermCourses()
                            facpeople: req.app.locals.facpeople, // list of SSN, first and last names of the Faculty table, from listFaculty()
                            facDetails: req.app.locals.facDetails, // from inquireFaculty
                            stdpeople: req.app.locals.stdpeople, // list of SSN, first and last names of the Student table, from listStudent()
                            stdDetails: req.app.locals.stdDetails // from inquireStudent()
     });
  } else if (req.body.role === "registrar") {
    console.log('Rendering Registrar Page...\n')
    res.render('registrar', { id, // input value from index
                              formdata: req.body,
                              termslist: req.app.locals.termslist, // list of terms in Offering table, from listTerms()
                              faculty: req.app.locals.faculty, // entire Faculty table, from getFaculty()
                              student: req.app.locals.student, // entire Student table, from getStudent ()
                              termslist: req.app.locals.termslist,  // list of terms represented in the Offering table, from listTerms()
                              termcourses: req.app.locals.termcourses, // list of courses offered in req.body.term_year, from listTermCourses()
                              facpeople: req.app.locals.facpeople, // list of SSN, first and last names of the Faculty table, from listFaculty()
                              facDetails: req.app.locals.facDetails, // from inquireFaculty
                              stdpeople: req.app.locals.stdpeople, // list of SSN, first and last names of the Student table, from listStudent()
                              stdDetails: req.app.locals.stdDetails // from inquireStudent()
     });
  } else {
    res.send('Invalid role');
  }
}

// app.get('/', (req, res) => {
//   res.render('index');
// });

// app.post('/role', (req, res) => {
//   const { id, role } = req.body;

//   if (role === 'student') {
//     res.render('student', { id });
//   } else if (role === 'teacher') {
//     res.render('teacher', { id });
//   } else {
//     res.send('Invalid role');
//   }
// });

module.exports = router;
