var fs = require('fs');
var express = require('express');
var bodyParser = require('body-parser');
var pg = require('pg');
const csv = require('csvtojson');

const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const csvWriter = createCsvWriter({
    path: 'compare.csv',
    header: [
        { id: 'speciality', title: 'speciality' },
        { id: 'email', title: 'email' }
    ]
});


const language = require('@google-cloud/language');

var conString = "postgres://aumkijzf:cGa0hnBJp6yQTdZwUhVCfz4D0jEQhHgx@pellefant.db.elephantsql.com:5432/aumkijzf";
var client = new pg.Client(conString);

var app = express();
// Use static files 
app.use(bodyParser.json());
var urlencodedParser = bodyParser.urlencoded({ extended: true });

app.set('view engine', 'ejs');
app.use(express.static('views'));


app.get('/login', function (req, res) {
    res.sendFile(__dirname + '/views/index.html');
});

app.post('/home', urlencodedParser, function (req, response) {
    console.log("I am in HOME POST METHOD");
    console.log("Email is: " + req.body.email);
    console.log("Emergency Contact is: " + req.body.emergency);
    console.log("Phone Number is: " + req.body.phone);
    console.log("User type is :" + req.body.subject);
    var name = req.body.first_name + " " + req.body.last_name;

    var userInfo = {
        Email: req.body.email,
        Emergency: req.body.emergency,
        Phone: req.body.phone,
        userType: req.body.subject,
        name: name
    }
    console.log("UserInfo JSON is " + userInfo.Email);
    response.render('inputTextUser', { userInfo: userInfo });
});


app.post('/displaylist', urlencodedParser, function (req, response) {
    console.log("List will be displayed here");
    var name = req.body.first_name + " " + req.body.last_name;
    var email = req.body.email;
    var phone = req.body.phone;
    var speciality = req.body.speciality;
    var range = req.body.subject;

    console.log(name + " " + email + " " + phone + " " + speciality + " " + range);

    var conString = "postgres://aumkijzf:cGa0hnBJp6yQTdZwUhVCfz4D0jEQhHgx@pellefant.db.elephantsql.com:5432/aumkijzf";
    var client = new pg.Client(conString);

    client.connect(function (err) {
        if (err) {
            console.err("Connected error in postgresql");
        }
        else {
            console.log("Connected to ElephantSQL");
            client.query('CREATE TABLE IF NOT EXISTS Psychiatrist (email Varchar(30) PRIMARY KEY , name Varchar(100), Phone Varchar(20), Range Varchar(100), Speciality Varchar(200))');

            const query = {
                text: 'INSERT INTO Psychiatrist(email, Name, Phone, Range, Speciality) VALUES($1, $2, $3, $4, $5)',
                values: [email, name, phone, range, speciality],
            }
            client.query(query, (err, res) => {
                if (err) {
                    console.log(err.stack);
                }
                else {
                    console.log("Successfully Added!");
                }
            });
        }
    });
});


app.post('/text', urlencodedParser, function (req, response) {
    var userFeeling = req.body.feeling;
    console.log("Feelings: " + userFeeling);

    // Instantiates a client
    const googleClient = new language.LanguageServiceClient();

    // The text to analyze
    const text = req.body.feeling;

    const document = {
        content: text,
        type: 'PLAIN_TEXT',
    };

    // Detects the sentiment of the text
    googleClient
        .analyzeSentiment({ document: document })
        .then(results => {
            const sentiment = results[0].documentSentiment;

            console.log(`Text: ${text}`);
            console.log(`Sentiment score: ${sentiment.score}`);
            console.log(`Sentiment magnitude: ${sentiment.magnitude}`);
            userInfo = {
                Email: req.body.email,
                Emergency: req.body.emergency,
                Phone: req.body.phone,
                InputText: req.body.feeling,
                SentimentScore: sentiment.score,
                SentimentMagnitude: sentiment.magnitude,
                userType: req.body.userType
            }

            var emoState;
            var score = sentiment.score;

            if (score >= -1 && score < -0.5) {
                emoState = "Severely Depressed";
            }
            else if (score >= -0.5 && score < 0.0) {
                emoState = "Moderate Depressed";
            }
            else if (score >= 0.0 && score < 0.3) {
                emoState = "Content";
            }
            else {
                emoState = "Happy";
            }
            console.log(emoState);

            client.connect(function (err) {
                if (err) {
                    console.err("Connected error in postgresql");
                }
                else {
                    console.log("Connected to ElephantSQL");
                    client.query('CREATE TABLE IF NOT EXISTS Users (email Varchar(30) PRIMARY KEY , Name Varchar(100), InputText Varchar(100), SentimentValue REAL, Range Varchar(50), EmergencyContact Varchar(30))');
                    const query = {
                        text: 'INSERT INTO Users(email, Name, InputText, SentimentValue, Range, EmergencyContact) VALUES($1, $2, $3, $4, $5, $6)',
                        values: [req.body.email, req.body.userName, req.body.feeling, sentiment.score, emoState, req.body.emergency],
                    }
                    client.query(query, (err, res) => {
                        if (err) {
                            console.log(err.stack);
                        }
                        else {
                            console.log("Successfully Added!");
                            const records = [
                                { speciality: req.body.feeling, email: req.body.email },
                            ];

                            client.query('SELECT email, Speciality FROM Psychiatrist', (err, res) => {
                                //console.log("Is " + JSON.stringify(res.rows));
                                var docObj = res.rows;
                                console.log("Doc Object" + docObj[0]);
                                console.log("Doc Object" + docObj[0].email);
                                console.log("Doc length " + docObj.length)
                                for (var i = 0; i < docObj.length; i++) {
                                    records.push(docObj[i]);
                                    console.log(docObj[i]);
                                }

                                csvWriter.writeRecords(records)
                                    .then(() => {
                                        console.log('...Done');
                                    })
                                callpython();
                                setTimeout(function () {
                                    client.query('SELECT useremail, firstdoctor, seconddoctor, thirddoctor FROM UserAssociateDoctor', (err, res) => {
                                        if (err) {
                                            throw err;
                                        }
                                        else {
                                            var resultObj = res.rows;
                                            console.log(resultObj[0]);
                                            if ( score < -0.3){
                                                response.render('helpPage', {emergencyContact: userInfo.Emergency});
                                            }
                                            else {
                                                response.render('docList', { resultObj: resultObj[0]});                                                
                                            }
                                        }
                                    });
                                }, 6000);
                            });
                        }
                    });
                }
            });
        })
        .catch(err => {
            console.error('ERROR:', err);
        });
});


function callpython() {
    var spawn = require('child_process').spawn;
    var py = spawn('python', ['mapping.py']);
}

app.post('/gethelp', (req, res) => {
    res.sendFile(__dirname + '/views/geo.html');
});


// -------------------------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------------------------------------------

var nodemailer = require('nodemailer');
var http = require('http').Server(app);
/**
 * The chat server
 */
var io = require('socket.io')(http);
var mongoose = require('mongoose');

app.use(bodyParser.urlencoded({ extended: false }))

var Message = mongoose.model('Message', {
    name: String,
    message: String
})

// app.get('/home', (req, res) =>{
//     res.sendFile(__dirname+'/home.html');
// })

app.get('/chat', (req, res) => {
    //res.render("index.ejs");
    var type = "patient";
    res.render("chat");
    //res.render("chat", {type:'patient', name:'bob'});
});

app.get('/messages', (req, res) => {
    Message.find({}, (err, messages) => {
        res.send(messages);
    });
})

app.get('/messages/:user', (req, res) => {
    var user = req.params.user
    Message.find({ name: user }, (err, messages) => {3
        res.send(messages);
    });
});

app.post('/messages', async (req, res) => {
    try {
        var message = new Message(req.body);

        var savedMessage = await message.save()
        console.log('saved');

        // var censored = await Message.findOne({message:'badword'});
        //   if(censored)
        //     await Message.remove({_id: censored.id});
        //   else
        io.emit('message', req.body);
        res.sendStatus(200);
    }
    catch (error) {
        res.sendStatus(500);
        return console.log('error', error);
    }
    finally {
        console.log('Message Posted');
    }
})

io.on('connection', () => {
    console.log('a user is connected');
})

mongoose.connect('mongodb://yhack:yhack2018@ds131139.mlab.com:31139/yhack', (err) => {
    console.log('mongodb connected', err);
})



app.post('/sendemail', (req, res) => {

    console.log("Lat is " + req.body.lat);
    console.log("Lon is " + req.body.lon);

    var transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: 'ml4connect@gmail.com',
            pass: 'CypressF123'
        }
    });
    //*****************need to access email from DB*****************/
    var mailOptions = {
        from: 'ml4connect@gmail.com',
        to: 'anujbastola10@gmail.com',
        subject: 'Urgent! Need Help!',
        text: 'Hi, Your friend is currently in a bad mental state. He/She is located at ' + req.body.lat + ' latitude and ' + req.body.lon + ' longitude.'
    };

    transporter.sendMail(mailOptions, function (error, info) {
        if (error) {
            console.log(error);
        } else {
            console.log('Email sent: ' + info.response);
            res.end('<html><head></head><body>Email Sent!</body></html>');
        }
    });
})



var server = http.listen(3000);
console.log("App Listening to port 3000");