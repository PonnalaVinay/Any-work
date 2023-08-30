const session = require('express-session');
const axios = require('axios');
const express = require('express');
const app = express();
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
var serviceAccount = require('./samplekey.json');
initializeApp({
  credential: cert(serviceAccount),
});
const db = getFirestore();

app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs'); // Set EJS as the view engine

app.use(session({
  secret: 'your-secret-key',
  resave: false,
  saveUninitialized: true,
}));

app.get('/', function (req, res) {
  res.render('login'); // Render the login.ejs view
});

app.get('/signup', function (req, res) {
  res.render('signup'); // Render the signup.ejs view
});

app.get('/signupSubmit', function (req, res) {
  // ... (your existing signupSubmit logic)
  const FullName = req.query.fullname;
  const Mail = req.query.email;
  const Password = req.query.password;
  db.collection('Information').add({
      Name: FullName,
      Email: Mail,
      password: Password,
  }).then(() => {
      // Redirect to the dashboard after successful signup
      res.redirect("/dashboard");
  });
});

app.get('/login', function (req, res) {
  res.render('login'); // Render the login.ejs view
});

app.get('/signIn', function (req, res) {
  // ... (your existing signIn logic)
  db.collection('Information').where('Email', '==', req.query.gmail).where('password', '==', req.query.security).get()
        .then((docs) => {
            if (docs.size > 0) {
                req.session.user = {
                    email: req.query.gmail,
                    authenticated: true
                };
                res.redirect("/dashboard");
            } else {
                res.send("Fail");
            }
        });
});

app.get('/dashboard', function (req, res) {
  if (req.session.user && req.session.user.authenticated) {
    res.render('dashboard'); // Render the dashboard.ejs view
  } else {
    res.redirect('/login');
  }
});

app.get('/logout', function (req, res) {
  // ... (your existing logout logic)
  req.session.destroy(function (err) {
    if (err) {
        console.error("Error destroying session:", err);
    }
    // Redirect to the login page after logout
    res.redirect("/login");
});
});

app.get('/bass', function (req, res) {
  res.render('bass'); // Render the bass.ejs view
});

app.get('/basss', function (req, res) {
  res.render('basss'); // Render the basss.ejs view
});
const maxWorkers = 25;
app.get('/In', async function (req, res) {
  try {
    const place1 = req.query.locality;
    const place2 = req.query.locality2;
    const place3 = req.query.locality3;
    const date = req.query.date;
    const worker = req.query.worker;
    function calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Earth's radius in kilometers
        const dLat = degToRad(lat2 - lat1);
        const dLon = degToRad(lon2 - lon1);
      
        const a =
          Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(degToRad(lat1)) * Math.cos(degToRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
      
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      
        const distance = R * c; // Distance in kilometers
        return distance;
      }
      
      function degToRad(deg) {
        return deg * (Math.PI / 180);
      }    
      async function fetchCityCoordinates(city) {
        try {
          const response = await axios.get('https://api.opencagedata.com/geocode/v1/json', {
            params: {
              q: city,
              key: 'f62dd8f2c0b5434cbcfe2af0036ca111', // Your API key here
            },
          });
      
          const latitude = response.data.results[0].geometry.lat;
          const longitude = response.data.results[0].geometry.lng;
      
          return {
            latitude: latitude,
            longitude: longitude,
          };
        } catch (error) {
          console.error('Error fetching coordinates:', error);
          throw error; // Re-throw the error to handle it in the caller function
        }
      }
    // ... (other code)

    // Fetch worker information for place1
    const querySnapshotPlace1 = await db
      .collection('Worker Information')
      .where('freetime', '==', date)
      .where('Occupation', '==', worker)
      .where('Location', '==', place1)
      .limit(maxWorkers)
      .get();
      const querySnapshotPlace2 = await db
      .collection('Worker Information')
      .where('freetime', '==', date)
      .where('Occupation', '==', worker)
      .where('Location', '==', place2)
      .limit(maxWorkers)
      .get();
      const querySnapshotPlace3 = await db
      .collection('Worker Information')
      .where('freetime', '==', date)
      .where('Occupation', '==', worker)
      .where('Location', '==', place3)
      .limit(maxWorkers)
      .get();
    // ... (similar code for place2 and place3)

    // Create table rows for place1
    const workerRowsPlace1 = [];
    let naturalIndexPlace1 = 1;
    querySnapshotPlace1.forEach((doc) => {
      const number = doc.get('Number');
      const name = doc.get('Name');
      let row = `<td>${naturalIndexPlace1}</td><td>${name}</td><td>${number}</td></tr>`;
      workerRowsPlace1.push(row);
      naturalIndexPlace1++;
    });

    // ... (similar code for place2 and place3)
    const workerRowsPlace2 = [];
    let naturalIndexPlace2 = 1;
    querySnapshotPlace2.forEach((doc) => {
      const number = doc.get('Number');
      const name = doc.get('Name');
      let row = `<tr><td>${naturalIndexPlace2}</td><td>${name}</td><td>${number}</td></tr>`;
      workerRowsPlace2.push(row);
      naturalIndexPlace2++;
    });
    const workerRowsPlace3 = [];
    let naturalIndexPlace3 = 1;
    querySnapshotPlace3.forEach((doc) => {
      const number = doc.get('Number');
      const name = doc.get('Name');
      let row = `<tr><td>${naturalIndexPlace3}</td><td>${name}</td><td>${number}</td></tr>`;
      workerRowsPlace3.push(row);
      naturalIndexPlace3++;
    });
    // Render tables for all places
    
    const tablePlace1 = createTable(workerRowsPlace1);
    const tablePlace2 = createTable(workerRowsPlace2);
    const tablePlace3 = createTable(workerRowsPlace3);
    // ... (similar code for place2 and place3)

    const finalTable = tablePlace1 + '<br>' + tablePlace2 + '<br>' + tablePlace3;
    res.send(finalTable);
  } catch (error) {
    console.error('Error occurred:', error);
    res.status(500).send('Error occurred while processing the request.');
  }
});

// Function to create an HTML table
function createTable(rows) {
  const tableRows = rows.join('');
  const table = `<table border="2"><tr><th>Natural Index</th><th>Name</th><th>Number</th></tr>${tableRows}</table>`;
  return table;
}

// ... (remaining routes and code)

  
  // ... (remaining routes and code)
  app.get('/Out', function (req, res) {
    // ... (your existing Out logic)
    const fullname = req.query.persons;
    const mobilenumber = req.query.phnos;
    const originate = req.query.localitys;
    const work = req.query.workers;
    const time = req.query.dates;
    db.collection('Worker Information').add({
      Name: fullname,
      Number: mobilenumber,
      Location: originate,
      Occupation: work,
      freetime: time,
    }).then(() => {
      res.send('Registered successfully');
    });
  });
  
  app.listen(4000);
  