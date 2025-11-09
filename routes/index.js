var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  console.log('req.body (GET): '+JSON.stringify(req.body));
  res.render('index', { title: '305demo' });
});

/* POST home page. */
router.post('/', function(req, res, next) {
  console.log('req.body (POST): '+JSON.stringify(req.body));
  if (req.body.HR_page) {
    console.log('HR page')
    res.render('HR_page', { title: 'HR page' });
  }
  else {
    res.render('index', { title: '305demo' });
  }
});

module.exports = router;