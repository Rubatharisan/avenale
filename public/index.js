$("#scanWebsite").submit(function(e){
    e.preventDefault();

    var data = {
        'domain': $('#userWebsite').val(),
        'email': $('#userEmail').val()
    }

    var success = function(e){
        //$("#scanSetup").fadeOut();
        $("#scanSetupSuccess").fadeIn();
    }

    $.ajax({
        type: "POST",
        url: '/crawl',
        data: data,
        success: success
    });
})