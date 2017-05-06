$("#scanWebsite").submit(function(e){
    e.preventDefault();

    var data = {
        'domain': $('#userWebsite').val(),
        'email': $('#userEmail').val()
    }

    var success = function(e){
        $("#scanSetup").fadeOut().promise().done(function(){
            $("#scanProgress").fadeIn();
        });
        //$("#scanSetupSuccess").fadeIn();
        $("#emailInfo").text(e.email);
        $("#domainInfo").text(e.domain);
        $("#sessionIdInfo").text(e.sessionId);
        $("#queueIdInfo").text(e.queueId);
        console.log(e);
        setupWebsocket(e.sessionId);
    }

    $.ajax({
        type: "POST",
        url: '/crawl',
        data: data,
        success: success
    });


})


var setupWebsocket = function(sessionId){
    console.log("HI!");
    // set-up a connection between the client and the server
    var data = {
        'sessionId': sessionId
    }

    $.ajax({
        type: "POST",
        url: '/setup/socket',
        data: data,
        success: function(e){
            console.log(e);
            if(e === "OK"){
                console.log("COOL!");
                initiateWebsocket(sessionId);
            }
        }
    });
}


var initiateWebsocket = function(sessionId){
    var socket = io('http://localhost:3001/' + sessionId);
    socket.on('message', function(msg){
        console.log(msg);
        setupCard(msg);
    });


}


var setupCard = function(entry){
    var blockSelector = '#goodCards';
    var cardSelector = '.good-card';

    if(entry.emotion == 'bad'){
        blockSelector = '#badCards';
        cardSelector = '.bad-card';
    }

    var myCard = $(cardSelector + ':first').clone();
    myCard.find('.card-block').text(entry.link);

    $(blockSelector).prepend('<br>');
    $(blockSelector).prepend(myCard);
    myCard.show();
}