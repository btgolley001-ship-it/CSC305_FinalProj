var express = require('express');
var router = express.Router();

/* GET home page. */

/*router.get('/', function(req, res, next) {
  console.log('req.body (GET): '+JSON.stringify(req.body));
  res.render('index', { title: '305demo' });
});*/

router.get('/', function(req, res, next) {
  console.log('req.query (GET): '+JSON.stringify(req.query));
  req.body = req.query; // Now behaves very much like POST
  res.render('index', {title: '305',
                       formdata: req.body});
});

/* POST home page. */

/*router.post('/', function(req, res, next) {
  console.log('req.body (POST): '+JSON.stringify(req.body));
  if (req.body.HR_page) {
    console.log('HR page')
    res.render('HR_page', { title: 'HR page' });
  }
  else {
    res.render('index', { title: '305demo' });
  }
});*/

router.post('/role', function(req, res, next) {
  console.log('req.body (POST): '+JSON.stringify(req.body));
  
  const { id, role } = req.body;

  if (role === 'student') {
    res.render('student', { id });
  } else if (role === 'teacher') {
    res.render('teacher', { id });
  } else {
    res.send('Invalid role');
  }
});

module.exports = router;