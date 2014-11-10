"use strict";
if (typeof document !== "undefined") $(function(){

    $("#error").html("");  // clear the "Missing Javascript" error message

    var pod = crosscloud.connect();
    var myMessages = [];

    var sendHelloWorld = function () {
        
        var thisMessage = { isHelloWorld4: true,
                            text: "Hello, World!",
                            when: (new Date()).toISOString()
                            // TODO add some link, like inspiredBy
                          };
        
        var nick = $("#nick").val()
        if (nick) thisMessage.fromNick = nick;
        
        myMessages.push(thisMessage);
        pod.push(thisMessage);
        
    };

    $("#helloButton").click(sendHelloWorld);

    // allow the enter key to be a submit as well
    $("#nick").keypress(function (e) {
        if (e.which == 13) {
            $("#helloButton").click();
            return false;
        }
    });

    var show = 5;
    var displayMessages = function (items) {
        $("#out").html("<table id='results'><tr><th>when</th><th>who</th><th>link</th><th>pod (data server)</th></tr></table>");
        var table = $("#results");
        items.sort(function(a,b){return a.when<b.when?1:(a.when===b.when?0:-1)});
        var count = 0;
        items.forEach(function(item) {
            count++;
            if (count <= 5) {
                var row = $("<tr>");
                row.append($("<td>").text(item.when || "---"));
                row.append($("<td>").text(item.fromNick || "(anon)"));
                row.append($("<td>").html("<a href='"+item._id+"'>data</a>"));
                row.append($("<td>").html("<a href='"+item._owner+"'>"+item._owner+"</a>"));
                if (item._owner==pod.getUserId()) {
                    row.append($("<td>").html("(you)"));
                }
                table.append(row)
            }
        });
        if (count > show) {
            $("#out").append("<p><i>("+(count-show)+" more not shown)</i></p>");
        }
    };

    pod.onLogin(function () {
        $("#out").html("waiting for data...");
        pod.onLogout(function () {
            $("#out").html("<i>not connected</i>");
        });

        pod.query()
            .filter( { isHelloWorld4:true } )
            .onAllResults(displayMessages)
            .start();
    });

});

