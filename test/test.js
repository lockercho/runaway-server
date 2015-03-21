var assert = require('chai').assert
var expect = require('chai').expect
var should = require('chai').should();
var querystring = require('querystring');
var request = require('request');
var _ = require('underscore');
var host = 'http://localhost:3000';
var reset_url = host+'/api/games/1/reset';

describe('Initail Game', function(){

    describe('Status of a game that is not started', function(){
        it('Alive count should all equals zero', function(done){
            var url = host+'/api/games/1';
            request(reset_url, function (err, res, body) {
                request(url, function (err, res, body) {
                    if (!err && res.statusCode == 200) {
                        try {
                            var status = JSON.parse(body); 
                            var i;
                            expect(status.alive.length, 'Number of teams').to.equal(4);
                            for(i=0; i<4 ; i++){
                                expect(status.alive[i], 'Alive count of team '+i).to.equal(0);
                            }
                            done();                     
                        }catch(e) {
                            done(e);    
                        }
                    }
                });
            });
        });
    });

    describe('Status when entering game', function(){
        describe('Status when normal entering game', function(){
            var i, j;
            var team_arr = _.shuffle([0,1,2,3]);
            var order_arr = _.shuffle([1,2,3,4,5,6,7,8,9,10,11,12]);
            var test_data = [];
            for(i=0;i<4; i++) {
                for(j=0; j<12 ; j++) {
                    test_data.push({
                        team: team_arr[i],
                        order: order_arr[j]
                    });
                }
            }   
            test_data = _.shuffle(test_data);
            var team_alive = {};
            var team, order;
            for(i=0; i<test_data.length ; i++) {
                team = test_data[i].team;
                order = test_data[i].order;
                if(typeof team_alive[team] == 'undefined') {
                    team_alive[team] = 0;
                }
                team_alive[team]++;
                it('Team '+team+' alive should equals '+team_alive[team], 
                    (function(team, order, alive_count){
                        return function(done){
                            var url = host+'/api/games/1/enter?team='+team+'&user_order='+order;
                            var status_url = host+'/api/games/1';
                            request(url, function (err, res, body) {
                                if (!err && res.statusCode == 200) {
                                    request(status_url, function (err, res, body) {
                                        if (!err && res.statusCode == 200) {
                                            try {
                                                var status = JSON.parse(body);
                                                expect(status.alive[team], 'Alive count of team '+team).to.equal(alive_count);
                                                done();                     
                                            }catch(e) {
                                                done(e);    
                                            }
                                        }
                                    });
                                }
                            });
                        };
                    })(team, order, team_alive[team])
                );
            }
        }); 
        
        describe("Status of all users should equals 'play'", function(){
            it("Status of all users should equals 'play'",function(done){
                var url = host+'/api/games/1/detail';
                request(url, function (err, res, body) {
                    try{
                        var data = JSON.parse(body);
                        var i,j;
                        for(i=0 ; i<data.length ; i++) {
                            for(j=0 ; j<data[i].users ; j++) {
                                expect(data[i].users[j].status).to.equal('play');
                            }
                        }
                        done();
                    } catch(e){
                        done(e);
                    }
                });
            });
        });

        describe('Status when entering game with invalid params', function(){
            it("Case: no team", function(done){
                var url = host+'/api/games/1/enter?user_order=1';
                var status_url = host+'/api/games/1';
                request(reset_url, function (err, res, body) {
                    request(url, function (err, res, enter_result) {
                        if (!err && res.statusCode == 200) {
                            
                            request(status_url, function (err, res, body) {
                                var i;
                                if (!err && res.statusCode == 200) {
                                    expect(enter_result).to.equal('{}');
                                    try {
                                        var status = JSON.parse(body);
                                        for(i=0 ; i<status.alive.length ; i++) {
                                            expect(status.alive[i]).to.equal(0);    
                                        }
                                        done();                     
                                    }catch(e) {
                                        done(e);    
                                    }
                                } else {
                                    done(err);
                                }
                            });
                        }
                    });
                });
            });

            it("Case: no order", function(done){
                var url = host+'/api/games/1/enter?team=0';
                var status_url = host+'/api/games/1';
                request(reset_url, function (err, res, body) {
                    request(url, function (err, res, enter_result) {
                        if (!err && res.statusCode == 200) {
                            
                            request(status_url, function (err, res, body) {
                                var i;
                                if (!err && res.statusCode == 200) {
                                    expect(enter_result).to.equal('{}');
                                    try {
                                        var status = JSON.parse(body);
                                        for(i=0 ; i<status.alive.length ; i++) {
                                            expect(status.alive[i]).to.equal(0);    
                                        }
                                        done();                     
                                    }catch(e) {
                                        done(e);    
                                    }
                                } else {
                                    done(err);
                                }
                            });
                        }
                    });
                });
            });

            it("Case: no team&order", function(done){
                var url = host+'/api/games/1/enter';
                var status_url = host+'/api/games/1';
                request(reset_url, function (err, res, body) {
                    request(url, function (err, res, enter_result) {
                        if (!err && res.statusCode == 200) {
                            
                            request(status_url, function (err, res, body) {
                                var i;
                                if (!err && res.statusCode == 200) {
                                    expect(enter_result).to.equal('{}');
                                    try {
                                        var status = JSON.parse(body);
                                        for(i=0 ; i<status.alive.length ; i++) {
                                            expect(status.alive[i]).to.equal(0);    
                                        }
                                        done();                     
                                    }catch(e) {
                                        done(e);    
                                    }
                                } else {
                                    done(err);
                                }
                            });
                        }
                    });
                });
            });
        });
    });

    

    // describe('Kill player success', function(){
    //     it("Get 'success' when kill success",function(done){
    //         var url = host+'/api/games/1/detail';
    //         request(url, function (err, res, body) {
    //             try{
    //                 var data = JSON.parse(body);
    //                 var i,j;
    //                 for(i=0 ; i<data.length ; i++) {
    //                     for(j=0 ; j<data[i].users ; j++) {
    //                         expect(data[i].users[j].status).to.equal('play');
    //                     }
    //                 }
    //                 done();
    //             } catch(e){
    //                 done(e);
    //             }
    //         });
    //     });
    // });
});
