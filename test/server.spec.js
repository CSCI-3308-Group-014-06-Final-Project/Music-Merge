// ********************** Initialize server **********************************

const server = require('../src/index'); //TODO: Make sure the path to your index.js is correctly added

// ********************** Import Libraries ***********************************

const chai = require('chai'); // Chai HTTP provides an interface for live integration testing of the API's.
const chaiHttp = require('chai-http');
chai.should();
chai.use(chaiHttp);
const {assert, expect} = chai;

// ********************** DEFAULT WELCOME TESTCASE ****************************

describe('Server!', () => {
  // Sample test case given to test / endpoint.
    it('Returns the default welcome message', done => {
    chai
        .request(server)
        .get('/welcome')
        .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body.status).to.equals('success');
            assert.strictEqual(res.body.message, 'Welcome!');
        done();
        });
    });
});

// *********************** TODO: WRITE 2 UNIT TESTCASES **************************

describe('Negative Testing Register', () => {
    it('negative : /register', done => {
       chai
       .request(server)
       .post('/register')
       .send({username: '', password: 'password'})
       .end((err, res) => {
           res.should.redirectTo(/register$/);
           done();
       });
       });
    });
    

describe('Positive Testing Register', () => {
    it('positive : /register', done => {
        chai
        .request(server)
        .post('/register')
        .send({username: 'NewUsername2', password: 'password'})
        .end((err, res) => {
            res.should.redirectTo(/login$/);
            done();
         });
    });
});

describe('Testing Login API', () => {
    it('positive : /login redirects to discover page on successful login', done => {
        chai
            .request(server)
            .post('/login')
            .send({username: 'ValidUser', password: 'CorrectPassword'})
            .end((err, res) => {
                res.should.redirectTo(/discover$/); 
                done();
            });
    });
});

describe('Testing Login API', () => {
    it('negative : /login', done => {
       chai
       .request(server)
       .post('/login')
       .send({username: 'James', password: 'thisisafakepassword'})
       .end((err, res) => {
           res.should.redirectTo(/login$/);
           done();
       });
    });
});
    

// ********************************************************************************