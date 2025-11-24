var express = require('express');
var router = express.Router();


router.get('/', function(req, res, next) {
  console.log('req.query (GET): '+JSON.stringify(req.query));
  req.body = req.query; // Now behaves very much like POST
  res.render('index', {title: '305',
                       formdata: req.body});
});


router.post('/role', function(req, res, next) {
  console.log('req.body (POST): '+JSON.stringify(req.body));
  
  var { id, role } = req.body;

  listTerms(req, res, next, id, role);
});


/*
 * Unconditionally set req.app.locals.termslist to be a list of the terms 
 * represented in the Offerings table, and call listTermCourses.
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
function changeFaculty(req, res, next) {
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
      changeEnrollment(req, res, next);
    }

    req.app.locals.db.run(sql, [], sqlCallback);
  }
  else {
    changeEnrollment(req, res, next);
  }
}

/*
 * If there is a query to run to change the Enrollment table (from student.pug), run it.
 * In any case, run getFaculty next.
 */
function changeEnrollment(req, res, next) {
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
      getFaculty(req, res, next);
    }

    req.app.locals.db.run(sql, [], sqlCallback);
  }
  else {
    getFaculty(req, res, next);
  }
}

/**
 * Unconditionally set req.app.locals.faculty to be a list of the
 * entire Faculty table.  Call listTerms next.
 */
function getFaculty(req, res, next) {
  let sql = 'SELECT * from Faculty order by FacLastName, FacFirstName, FacSSN;'
  req.app.locals.db.all(sql, [], (err, rows) => {
    if (err) {
      throw err;
    }
    req.app.locals.faculty = rows;
    getStudent(req, res, next);
  })
}

/**
 * Unconditionally set req.app.locals.faculty to be a list of the
 * entire Faculty table.  Call listTerms next.
 */
function getStudent(req, res, next) {
  let sql = 'SELECT * from Student order by StdLastName, StdFirstName, StdSSN;'
  req.app.locals.db.all(sql, [], (err, rows) => {
    if (err) {
      throw err;
    }
    req.app.locals.student = rows;
    listTerms(req, res, next);
  })
}

function listTerms(req, res, next, id, role) {
  let sql = 'SELECT distinct OffTerm, OffYear from Offering order by OffYear;'
  req.app.locals.db.all(sql, [], (err, rows) => {
      if (err) {
        throw err;
      }
      req.app.locals.termslist = rows;
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
    req.app.locals.title = 
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
      renderPage(req, res, next, id, role);
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
    req.app.locals.title = 
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
  if (role === 'student') {
    res.render('student', { id });
  } else if (role === 'teacher') {
    res.render('teacher', { id });
  } else if (role === 'registrar') {
    res.render('registrar', { id });
  } else {
    res.send('Invalid role');
  }
  res.render('index', { title: req.app.locals.title,
                        formdata: req.body,
                        termscourses: req.locals.termcourses,
                        termslist: req.app.locals.termslist,
                        facpeople: req.app.locals.facpeople,
                        facdetails: req.app.locals.facDetails,
                        faculty: req.app.locals.faculty,
                        stdpeople: req.app.locals.facpeople,
                        stddetails: req.app.locals.facDetails,
                        student: req.app.locals.student                        
  });
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
