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

$("#backButton").click(function(){
    $("#linkOverview").fadeOut().promise().done(function(){

        $("#linkTitel").empty();
        $("#metaData").empty();
        $("#appearsOn").empty();
        $('#linksTo').empty();

        $("#scanProgress").fadeIn();

        $('html, body').animate({
            scrollTop: $("#scanProgress").offset().top
        }, 1000);
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
            if(e === "OK"){
                initiateWebsocket(sessionId);
            }
        }
    });
}



$('body').on('click', 'div.card', function(e) {
    var link = e.currentTarget.getElementsByTagName('p')[0].innerHTML;
    var sessionId = $('#sessionIdInfo')[0].innerHTML;

    requestData(link, sessionId, function(){
        $("#scanProgress").fadeOut().promise().done(function(){
            $("#linkOverview").fadeIn();
            $('html, body').animate({
                scrollTop: $("#linkOverview").offset().top
            }, 1000);
        });
    });


});



var requestData = function(link, sessionId, callback){

    var data = {
        'sessionId': sessionId,
        'link': link
    }

    $.ajax({
        type: "POST",
        url: '/request',
        data: data,
        success: function(e){
            console.log(e);
            viewData(e);
            callback();
        }
    });
}


var viewData = function(data){
    $("#linkTitel").empty();
    $("#metaData").empty();
    $("#appearsOn").empty();
    $('#linksTo').empty();

    viewMeta(data.meta);
    viewAppearsOn(data.appears_on);
    viewLinksTo(data.links_to);

}

var viewMeta = function(data){
    for(var entry in data){
        if(entry == 'page_link'){
            $('#linkTitel').text(data[entry]);
        } else {
            $('<p>').attr('id', entry).text(entry).append('<br><small class="text-muted"><strong>'+data[entry]+'</strong></small>').appendTo('#metaData');
        }
    }
}

var viewAppearsOn = function(data){
    for(var entry in data){
        setupCard(data[entry], '#appearsOn');
        console.log(data[entry]);
    }
}

var viewLinksTo = function(data){
    for(var entry in data){
        setupCard(data[entry], '#linksTo');
        console.log(data[entry]);
    }
}



var initiateWebsocket = function(sessionId){
    var socket = io('http://localhost:3001/' + sessionId);
    socket.on('message', function(msg){
        setupCard(msg);
    });


}


var setupCard = function(entry, block){

    var blockSelector;
    var cardSelector;


    if(block == undefined){
        blockSelector = '#goodCards';
        cardSelector = '.good-card';

        if(entry.emotion == 'bad'){
            blockSelector = '#badCards';
            cardSelector = '.bad-card';
        }

        entry = entry.link;

    } else {

        blockSelector = block;
        cardSelector = '.card';

    }


    var myCard = $(cardSelector + ':first').clone();
    myCard.find('.linkId').text(entry);
    myCard.find('#linkId').val(entry);

    $(blockSelector).prepend('<br>');
    $(blockSelector).prepend(myCard);
    myCard.show();
}