// vim: ts=4:sw=4:et

var localFile, reader;

var Hour = new Timespan("Hour", 1/24);
var Day = new Timespan("Day", 1);
var Week = new Timespan("Week", 7);
var Month = new Timespan("Month", 30);
var Year = new Timespan("Year", 365);
var refreshRate = 30;
var timespans = [];
var summaryCoinRate, summaryCoin;
var earningsOutputCoinRate, earningsOutputCoin;
var outputCurrencyDisplayMode = 'all'
var validOutputCurrencyDisplayModes = ['all', 'summary'];
var effRateMode = 'lentperc';
var validEffRateModes = ['lentperc', 'onlyfee'];

// BTC DisplayUnit
var BTC = new BTCDisplayUnit("BTC", 1);
var mBTC = new BTCDisplayUnit("mBTC", 1000);
var Bits = new BTCDisplayUnit("Bits", 1000000);
var Satoshi = new BTCDisplayUnit("Satoshi", 100000000);
var displayUnit = BTC;
var btcDisplayUnitsModes = [BTC, mBTC, Bits, Satoshi];

// Date Format
    var dateformat = localStorage.getItem('dateformat') || 'DD. M. YYYY H:mm:ss ';
 
//Account value
    var totalvalue = 0;
    var coinarray = [];
//Min Coins based on https://github.com/BitBotFactory/poloniexlendingbot/issues/347
    var items = [['BTC','BTS','CLAM','DASH','DOGE','ETH','FCT','LTC','MAID','STR','XMR','XRP'],[0.00019124,10,10,0,100,0,100,0,10,100,0,100]];

//vermögen + customizable bars http://www.chartjs.org/docs/latest/charts/bar.html https://ip.bitcointalk.org/?u=https%3A%2F%2Fpreview.ibb.co%2FepdNav%2FFlyer.jpg&t=577&c=Ut0cQQfdlw6HkQ 

$.get( "https://blockchain.info/ticker?cors=true", function( data ) {
  $.each(data,function(v,m){
	  $('#currencydropdown').append('<a class="dropdown-item" href="#" data-name="'+v+'" data-value="'+m['last']+'">'+v+'</a>');
  });
  
});
$(document.body).on('click',".dropdown-item",function(){
	localStorage.setItem("displayCurrency",$(this).data("name"));
	localStorage.setItem("displayCurrencyRate",$(this).data("value"));
	window.location.reload(true);
});
	
function mincoincheck(coin,value){
    for (var i = items[0].length - 1; i >=0; i--) {
     if(items[0][i] == coin) {
         if (value >= items[1][i]) {return value;}
         else {return '<a data-toggle="tooltip" style="color:red" class="plb-tooltip" title=" Minimum ' + items[1][i] + ' Coins ">' + value + '</a>';}
         }
    }
}


    var InterestDoughnutChart = new Chart(interestChart, {
    type: 'doughnut',
    data: {datasets: [{data: []}],labels: []},
	 options: {
	   legend: {
            display: false,
	   }
	 }
    });


    var DoughnutChart = new Chart(capitalChart, {
    type: 'doughnut',
    data: {datasets: [{data: []}],labels: []},
	 options: {
	   legend: {
            display: false,
	   }
	 }
    });
balance = "";
function createinterest(){
	 balance = "";
	 $('.cardoverview .cardclone').remove();
	$.get( "https://poloniex.com/public?command=returnTicker", function( data ) {
     $.each(data,function(k,v){
	  if (k.indexOf('BTC_') >=0) {
		  var coin = k.replace("BTC_","");
		  var highbid = v["highestBid"];
		  //console.log(coin,value);
		  $.each(coinarray,function(key,value){
			  if (value["coin"] == coin) {
				  coinarray[key]["highestBid"] = highbid;
				  coinarray[key]["balance"] = (localStorage.getItem('displayCurrencyRate') * (coinarray[key]["totalcoins"] * coinarray[key]["highestBid"])).toFixed(2) ;
				  coinarray[key]["interestcoin"] = "TBD";
				  coinarray[key]["interestpercent"] = "TBD";
				  coinarray[key]["interest"] = "TBD";
				  balance = +balance + +coinarray[key]["balance"];
				  var template = $("#cardtemplate").clone().removeAttr("style","id").addClass("cardclone");  
				  $('.coinname',template).html(coin);
				  $('.cardcoinlent',template).html("TBD");
				  $('.cardcointotal',template).html(coinarray[key]["balance"]);
				  $('.cardearned',template).html(coinarray[key]["interestcoin"]);
				  $('.cc',template).addClass(coin);
				  
				  $('.cardoverview').append(template);
				  //clone, then update
			  }
		  })
	  }
	$('#totalcash').html((+balance).toFixed(2));
	
	
	 
	//coin + rate table  https://poloniex.com/public?command=returnLoanOrders&currency=DASH  $('#cointable tbody').empty(); $('#cointable').append('<tr><td>'+coinicon(coin)+'</td><td>'+value["highestBid"]+'</td></tr>'); 
	// max-min * 365
	 
	 //gesamt vermögen
	 // gesamt zinsen
     });
	});
	return coinarray;
}

coins = [];
coinnames = [];

function updatedonut(){
	
	   coins = [];
	   coinnames = [];
	   coincolors = [];
	   $.each(coinarray,function(key,value){
		   coins.push(value["totalcoins"]);
		   coinnames.push(value["coin"]);
		   
		   var $inspector = $("<i class='cc'>").css('display', 'none').addClass(value["coin"]);
			$("body").append($inspector); 
			try {
				coincolors.push($inspector.css('color'));
			} finally {
				$inspector.remove(); 
			}
		   
	   })
	   
	   DoughnutChart.data.datasets[0].data = coins;
	   DoughnutChart.data.labels = coinnames;
	   DoughnutChart.data.datasets[0].backgroundColor = coincolors;
	   DoughnutChart.update();
	   
	   InterestDoughnutChart.data.datasets[0].data = createinterest();
	   InterestDoughnutChart.data.labels = coinnames;
	   InterestDoughnutChart.data.datasets[0].backgroundColor = coincolors;
	   InterestDoughnutChart.update();

	}

function notification(string){
	
	if(localStorage.getItem('notification') == "push") {
        Push.create("Loan placed", {
           body: string,
           icon: 'https://github.com/shphrd/crypto-icons/raw/master/color-icons/png/%402x/Bitcoin%402x.png',
           timeout: 4000,
           onClick: function () {
              window.focus();
              this.close();
              }
       });
    } else if (localStorage.getItem('notification') == "toastr") {
        toastr.options = {
           "positionClass": "toast-top-right"
        }
	   toastr.success(string); //loan placed
	   //toastr.warning('My name is Inigo Montoya. You killed my father, prepare to die!') //loading-warning
    }
	
} 
   
function coinicon(string){
    var arr = ['BTC','BTS','CLAM','DASH','DOGE','ETH','FCT','LTC','MAID','STR','XMR','XRP'];
    var output = '';
    for (var i = arr.length - 1; i >=0; i--) {
        if (string.indexOf(arr[i]) >= 0) {
            output = "<i class='cc " + arr[i] + "'></i> ";
        }
    }
    return output + string;
}   
    
function updateJson(data) {
	if((data.last_status).length > 0){
		$('.updated').css("color","green").prop('title',moment(data.last_update,'YYYY-MM-DD h:mm:ss').format(dateformat));
	} else {
		$('.updated').css("color","red").prop('title',data.last_status + ' ' + moment(data.last_update,'YYYY-MM-DD h:mm:ss').format(dateformat));
	}  
	
    var rowCount = data.log.length;
    var successnumber = 0;
    var cancelednumber = 0;
    var errornumber = 0;
	var dataSet = [];
	var logdataSet = [];
	
	$('#coinstatustable tbody').empty();
	
	$.each(coinarray,function(key,value){
		$('#coinstatustable').append('<tr><td>'+coinicon(value["coin"])+'</td><td>'+value["totalcoins"]+'</td><td>'+value["balance"]+'</td><td>'+value["interestcoin"]+'</td><td>'+value["interestpercent"]+'</td><td>'+value["interest"]+'</td></tr>');
	})
	
	
    //canceled vergessen + farbige zeilen??? https://datatables.net/examples/advanced_init/row_callback.html + datesorting mit abkürzung
    for (var i = rowCount - 1; i >=0; i--) {
		
        var time = moment((data.log[i]).substring(0,19),'YYYY-MM-DD h:mm:ss').format(dateformat);
        
        if (moment().diff(moment((data.log[i]).substring(0,19),'YYYY-MM-DD h:mm:ss'),'days') < 1) {
            var timestring = '<a data-toggle="tooltip" class="plb-tooltip" title="' + time + '">' + moment().diff(moment((data.log[i]).substring(0,19),'YYYY-MM-DD h:mm:ss'),'hours') + ' hours ago</a>';
        }
        else {
            var timestring = '<a data-toggle="tooltip" class="plb-tooltip" title="' + time + '">' + moment().diff(moment((data.log[i]).substring(0,19),'YYYY-MM-DD h:mm:ss'),'days') + ' days ago</a>';
        }
        
        var message = (data.log[i]).substring(20);
        if (data.log[i].indexOf("Error") >= 0) {
            message = '<div class="alert alert-danger" role="alert">' + message + '</div>';
            errornumber++;
			logdataSet.push(["Error",timestring,message.replace("Error: ","")]);
        }
        else if (data.log[i].indexOf("Placing") >= 0) {

            message = '<div class="alert alert-success" role="alert">' +  coinicon(message) + '</div>';
            successnumber++;
			
			var regexarray = [/(\d{4}[.-]\d{2}[.-]\d{2}[ ]\d{2}[:]\d{2}[:]\d{2})/,/[ ]\d{0,20}[.]\d{0,20}[ ]([A-Z]{0,10})[ ]/,/[ ](\d{0,20}[.]\d{0,20})[ ]/,/\bfor?\b[ ](\d{0,3})[ ]/,/(\d{0,4}[.]\d{0,8}[%])/];
			var resultarray = [];
			$.each(regexarray,function(index,value){
				resultarray.push(((data.log[i]).match(regexarray[index]))[1]);
			});
			
			dataSet.push([resultarray[0],coinicon(resultarray[1]),resultarray[2],resultarray[3],resultarray[4]]);
			
			logdataSet.push(["Success",timestring,message]);
        }
        else {
            message = '<div class="alert alert-custom" role="alert">' +  coinicon(message) + '</div>';
			logdataSet.push(["Info",timestring,message]);
        }
        
        
        $('#successnumber').text(successnumber);
        $('#cancelednumber').text(cancelednumber);
        $('#errornumber').text(errornumber);
        $('#infonumber').text(data.log.length - (successnumber + cancelednumber + errornumber));
        
        if($('.btn-success').hasClass('disabled')) {$('#logtable .alert-success').closest('.row').hide();}
        if($('.btn-info').hasClass('disabled'))    {$('#logtable .alert-info').closest('.row').hide();}
        if($('.btn-danger').hasClass('disabled'))  {$('#logtable .alert-danger').closest('.row').hide();}
        if($('.infobutton').hasClass('disabled'))  {$('#logtable .alert-custom').closest('.row').hide();}
    }

    updateOutputCurrency(data.outputCurrency);
    updateRawValues(data.raw_data);
	
	if ( $.fn.dataTable.isDataTable( '#openloans' ) ) {
    mydatatable = $('#openloans').dataTable();
    }
    else {
    mydatatable = $('#openloans').dataTable({responsive: true});
    }

    mydatatable.fnClearTable();
    mydatatable.fnAddData(dataSet);
	
	if ( $.fn.dataTable.isDataTable( '#logtable' ) ) {
    logtable = $('#logtable').dataTable();
    }
    else {
    logtable = $('#logtable').dataTable({responsive: true});
    }

	logtable.fnClearTable();
    logtable.fnAddData(logdataSet);
	
	notification("Update");
}

function updateOutputCurrency(outputCurrency){
    var OutCurr = Object.keys(outputCurrency);
    summaryCoin = localStorage.getItem('displayCurrency') || outputCurrency['currency'];
    summaryCoinRate = parseFloat(localStorage.getItem('displayCurrencyRate') || outputCurrency['highestBid']);
    // switch between using outputCoin for summary only or all lending coins earnings
    if(outputCurrencyDisplayMode == 'all') {
        earningsOutputCoin = summaryCoin;
        earningsOutputCoinRate = summaryCoinRate;
    } else {
        earningsOutputCoin = 'BTC'
        earningsOutputCoinRate = 1;
    }
}

// prints a pretty float with accuracy.
// above zero accuracy will be used for float precision
// below zero accuracy will indicate precision after must significat digit
// strips trailing zeros
function prettyFloat(value, accuracy) {
    var precision = Math.round(Math.log10(value));
    var result = precision < 0 ? value.toFixed(Math.min((accuracy - precision), 8)) : value.toFixed(accuracy);
    return isNaN(result) ? '0' : result.replace(/(?:\.0+|(\.\d+?)0+)$/, '$1');
}

function printFloat(value, precision) {
    var multiplier = Math.pow(10, precision);
    var result = Math.round(value * multiplier) / multiplier;
    return result = isNaN(result) ? '0' : result.toFixed(precision);
}

coinarray = [];

function updateRawValues(rawData){
    var table = document.getElementById("detailsTable");
    table.innerHTML = "";
    var currencies = Object.keys(rawData);
    var totalBTCEarnings = {};
    totalvalue = 0;
	coinarray = [];
    for (var keyIndex = 0; keyIndex < currencies.length; ++keyIndex)
    {
        var currency = currencies[keyIndex];
        var btcMultiplier = currency == 'BTC' ? displayUnit.multiplier : 1;
        var averageLendingRate = parseFloat(rawData[currency]['averageLendingRate']);
        var lentSum = parseFloat(rawData[currency]['lentSum']);
        var totalCoins = parseFloat(rawData[currency]['totalCoins']);
        var maxToLend = parseFloat(rawData[currency]['maxToLend']);
        var highestBidBTC = parseFloat(rawData[currency]['highestBid']);
		
        coinarray.push({coin: currency, totalcoins:totalCoins || lentSum})
        if (currency == 'BTC') {
            // no bids for BTC provided by poloniex
            // this is added so BTC can be handled like other coins for conversions
            highestBidBTC = 1;
        }
        var couple = rawData[currency]['couple'];

        if (!isNaN(averageLendingRate) && !isNaN(lentSum) || !isNaN(totalCoins))
        {

            // cover cases where totalCoins isn't updated because all coins are lent
            if (isNaN(totalCoins) && !isNaN(lentSum)) {
                totalCoins = lentSum;
            }
            var rate = +averageLendingRate  * 0.85 / 100; // 15% goes to Poloniex fees

            var earnings = '';
            var earningsSummaryCoin = '';
            timespans.forEach(function(timespan) {
                // init totalBTCEarnings
                if (isNaN(totalBTCEarnings[timespan.name])) {
                    totalBTCEarnings[timespan.name] = 0;
                }

                // calculate coin earnings
                timespanEarning = timespan.calcEarnings(lentSum, rate);
                earnings += timespan.formatEarnings(currency, timespanEarning, true);

                // sum BTC earnings for all coins
                if(!isNaN(highestBidBTC)) {
                    timespanEarningBTC = timespan.calcEarnings(lentSum * highestBidBTC, rate);
                    totalBTCEarnings[timespan.name] += timespanEarningBTC;
                    if(currency != earningsOutputCoin) {
                        earningsSummaryCoin += timespan.formatEarnings(earningsOutputCoin, timespanEarningBTC * earningsOutputCoinRate);
                    }
                }

            });

            var effRateModePerc = 1;
            if (effRateMode == 'lentperc')
                effRateModePerc = lentSum / totalCoins;
            var effectiveRate = rate * 100 * effRateModePerc;
            var yearlyRate = rate * 100 * 365 * effRateModePerc; // no reinvestment
            var yearlyRateComp = (Math.pow(rate + 1, 365) - 1) * 100 * effRateModePerc; // with daily reinvestment

            var lentPerc = lentSum / totalCoins * 100;
            var lentPercLendable = lentSum / maxToLend * 100;
            function makeTooltip(title, text) {
                return '&nbsp;<a data-toggle="tooltip" class="plb-tooltip" title="' + title + '">' + text + '</a>';
            }
            var avgRateText = makeTooltip("Average loan rate, simple average calculation of active loans rates.", "Avg.");
            var effRateText;
            if (effRateMode == 'lentperc')
                effRateText = makeTooltip("Effective loan rate, considering lent precentage and poloniex 15% fee.", "Eff.");
            else
                effRateText = makeTooltip("Effective loan rate, considering poloniex 15% fee.", "Eff.");
            var compoundRateText = makeTooltip("Compound rate, the result of reinvesting the interest.", "Comp.");
            var displayCurrency = currency == 'BTC' ? displayUnit.name : currency;
               
            //placeholder for https://github.com/BitBotFactory/poloniexlendingbot/pull/349   
            //<p style="text-align:center">Earned ' + [API-Response] +' <i class="cc ' + displayCurrency + '"></i></p>
            
            var lentStr = '<div class="progress" style="margin-bottom:20px"><div class="progress-bar bg-success" role="progressbar" aria-valuenow="'+printFloat(lentPerc, 2)+'" aria-valuemin="0" aria-valuemax="100" style="width:'+printFloat(lentPerc, 2)+'%">'+printFloat(lentPerc, 2)+'</div></div><p style="text-align:center">Lent ' + printFloat(lentSum * btcMultiplier, 4) +' of ' + mincoincheck(displayCurrency,printFloat(totalCoins * btcMultiplier, 4)) + ' (' + printFloat(lentPerc, 2) + '%)</p>';
                       
            if (lentSum > 0) {
               var detaildown = (localStorage.getItem(displayCurrency) == "true") ? 'none' : '';
               var detailup = (localStorage.getItem(displayCurrency) == "true") ? '' : 'none';
               var currencyStr = "<i class='cc " + displayCurrency + "'></i> " + displayCurrency + ' <span class="fa fa-chevron-down" onClick="coindetails(this,\''+displayCurrency+'\',\'true\')" aria-hidden="true" style="display:'+detaildown+'"></span><span class="fa fa-chevron-up " onClick="coindetails(this,\''+displayCurrency+'\',\'false\')" aria-hidden="true" style="display:'+detailup+'"></span>';
            } else {
               var currencyStr = "<i class='cc " + displayCurrency + "'></i> " + displayCurrency;   
            }
            if(!isNaN(highestBidBTC) && earningsOutputCoin != currency) {
                var coinvalue = 'Total: ' + Math.round(prettyFloat(earningsOutputCoinRate * highestBidBTC / btcMultiplier , 4) * printFloat(totalCoins * btcMultiplier, 4)) + ' ' + earningsOutputCoin;
                currencyStr += "<br/>1 "+ displayCurrency + " = " + prettyFloat(earningsOutputCoinRate * highestBidBTC / btcMultiplier , 2)  + ' ' + earningsOutputCoin + '<br/>' +coinvalue;
                totalvalue += Math.round(prettyFloat(earningsOutputCoinRate * highestBidBTC / btcMultiplier , 4) * printFloat(totalCoins * btcMultiplier, 4));
            }
            var rowValues = [currencyStr, lentStr,
                "<div class='inlinediv hidden-md-down' >" + printFloat(averageLendingRate, 5) + '% Day' + avgRateText + '<br/>'
                    + printFloat(effectiveRate, 5) + '% Day' + effRateText + '<br/></div>'
                    + "<div class='inlinediv hidden-md-down' >" + printFloat(yearlyRate, 2) + '% Year<br/>'
                    +  printFloat(yearlyRateComp, 2) + '% Year' + compoundRateText + "</div>" ];

            // print coin status
            var row = table.insertRow();
            for (var i = 0; i < rowValues.length; ++i) {
                var cell = row.appendChild(document.createElement("td"));
                cell.innerHTML = rowValues[i];
                cell.style.verticalAlign = "";
                if (i == 0) {
                    cell.setAttribute("width", "20%");
                }
            }
            $(row).find('[data-toggle="tooltip"]').tooltip();

            var earningsColspan = rowValues.length - 1;
            // print coin earnings
            var row = table.insertRow();
            row.className = 'coindetails';
            
            if(localStorage.getItem(displayCurrency) == "true") {
               row.style.display = "";   
            } else {
               row.style.display = "none";
            }
            
            if (lentSum > 0) {
                var cell1 = row.appendChild(document.createElement("td"));
                cell1.innerHTML = "<span class='hidden-md-down'>"+ displayCurrency +"<br/></span>Est. "+ compoundRateText +"<br/>Earnings";
                var cell2 = row.appendChild(document.createElement("td"));
                cell2.setAttribute("colspan", earningsColspan);
                if (earningsSummaryCoin != '') {
                    cell2.innerHTML = "<div class='inlinediv' >" + earnings + "<br/></div><div class='inlinediv' style='padding-right:0px'>"+ earningsSummaryCoin + "</div>";
                } else {
                    cell2.innerHTML = "<div class='inlinediv' >" + earnings + "</div>";
                }
            }
        }
    }

    // add headers
    var thead = table.createTHead();

    // show account summary
    if (currencies.length > 1 || summaryCoin != earningsOutputCoin) {
        earnings = '';
        timespans.forEach(function(timespan) {
            earnings += timespan.formatEarnings( summaryCoin, totalBTCEarnings[timespan.name] * summaryCoinRate);
            
        });
        var row = thead.insertRow(0);
        var cell = row.appendChild(document.createElement("th"));
        cell.innerHTML = "Value<br/>Account<br/>Estimated<br/>Earnings";
        cell.style.verticalAlign = "text-top";
        cell = row.appendChild(document.createElement("th"));
        cell.setAttribute("colspan", 2);
        cell.innerHTML = totalvalue + ' ' + earningsOutputCoin + '<br/>' + earnings;
    }
	
	updatedonut();
}

function handleLocalFile(file) {
    localFile = file;
    reader = new FileReader();
    reader.onload = function(e) {
        updateJson(JSON.parse(reader.result));
    };
    reader.readAsText(localFile, 'utf-8');
}

function loadData() {
    if (localFile) {
        reader.readAsText(localFile, 'utf-8');
        setTimeout('loadData()', refreshRate * 1000)
    } else {
        // expect the botlog.json to be in the same folder on the webserver
        var file = 'botlog.json';
        $.getJSON(file, function (data) {
            updateJson(data);
            // reload every 30sec
            setTimeout('loadData()', refreshRate * 1000)
        }).fail( function(d, textStatus, error) {
            $('#status').text("getJSON failed, status: " + textStatus + ", error: "+error);
            // retry after 60sec
            setTimeout('loadData()', 60000)
        });;
    }
}

function Timespan(name, multiplier) {
    this.name = name;
    this.multiplier = multiplier;
    this.calcEarnings = function(sum, rate) {
        return sum * Math.pow(1 + rate, multiplier) - sum;
    };
    this.formatEarnings = function(currency, earnings, minimize_currency_xs) {
        if (currency == "BTC" && this == Hour) {
            return printFloat(earnings * 100000000, 0) + " Satoshi / " + name + "<br/>";
        } else {
            var currencyClass = '';
            if (minimize_currency_xs) {
                currencyClass = 'hidden-md-down';
            }
            if (currency == "BTC") {
                return displayUnit.formatValue(earnings) + " <span class=" + currencyClass + ">" + displayUnit.name + "</span> / " + name + "<br/>"
            } else if (currency == "USD" || currency == "USDT" || currency == "EUR") {
                return prettyFloat(earnings, 2) + " <span class=" + currencyClass + ">" + currency + "</span> / "+  name + "<br/>";
            } else {
                return printFloat(earnings, 8) + " <span class=" + currencyClass + ">" + currency + "</span> / "+  name + "<br/>";
            }
        }
    };
}

function BTCDisplayUnit(name, multiplier) {
    this.name = name;
    this.multiplier = multiplier;
    this.precision = Math.log10(multiplier);
    this.formatValue = function(value) {
        return printFloat(value * this.multiplier, 8 - this.precision);
    }
}

function setEffRateMode() {
    var q = location.search.match(/[\?&]effrate=[^&]+/);

    if (q) {
        //console.log('Got effective rate mode from URI');
        effRateMode = q[0].split('=')[1];
    } else {
        if (localStorage.effRateMode) {
            //console.log('Got effective rate mode from localStorage');
            effRateMode = localStorage.effRateMode;
        }
    }
    if (validEffRateModes.indexOf(effRateMode) == -1) {
        console.error(effRateMode + ' is not valid effective rate mode! Valid values are ' + validModes);
        effRateMode = validEffRateModes[0];
    }
    localStorage.effRateMode = effRateMode;
    $("input[name='effRateMode'][value='"+ effRateMode +"']").prop('checked', true);;
    //console.log('Effective rate mode: ' + effRateMode);
}

function setBTCDisplayUnit() {
    var q = location.search.match(/[\?&]displayUnit=[^&]+/);
    var displayUnitText = 'BTC';

    if (q) {
        //console.log('Got displayUnitText from URI');
        displayUnitText = q[0].split('=')[1];
    } else {
        if (localStorage.displayUnitText) {
            //console.log('Got displayUnitText from localStorage');
            displayUnitText = localStorage.displayUnitText;
        }
    }

    $("input[name='btcDisplayUnit'][value='"+ displayUnitText +"']").prop('checked', true);;

    btcDisplayUnitsModes.forEach(function(unit) {
        if(unit.name == displayUnitText) {
            displayUnit = unit;
            localStorage.displayUnitText = displayUnitText;
        }
    })
    //console.log('displayUnitText: ' + displayUnitText);
}

function setOutputCurrencyDisplayMode() {
    var q = location.search.match(/[\?&]earningsInOutputCurrency=[^&]+/);
    var outputCurrencyDisplayModeText = 'all';

    if (q) {
        outputCurrencyDisplayModeText = q[0].split('=')[1];
    } else {
        if (localStorage.outputCurrencyDisplayModeText) {
            outputCurrencyDisplayModeText = localStorage.outputCurrencyDisplayModeText;
        }
    }

    $("input[name='outputCurrencyDisplayMode'][value='"+ outputCurrencyDisplayModeText +"']").prop('checked', true);;

    validOutputCurrencyDisplayModes.forEach(function(mode) {
        if(mode == outputCurrencyDisplayModeText) {
            outputCurrencyDisplayMode = mode;
            localStorage.outputCurrencyDisplayModeText = outputCurrencyDisplayModeText;
        }
    })
    //console.log('outputCurrencyDisplayMode: ' + outputCurrencyDisplayModeText);

}

function loadSettings() {
    // Refresh rate
    refreshRate = localStorage.getItem('refreshRate') || 30
    $('#refresh_interval').val(refreshRate)

    //Date Format
    $('#dateformat').val(localStorage.getItem('dateformat') || "YYYY-MM-DD h:mm:ss")
    
    // Time spans
    var timespanNames = JSON.parse(localStorage.getItem('timespanNames')) || ["Year", "Month", "Week", "Day", "Hour"]
    
    timespans = [Year, Month, Week, Day, Hour].filter(function(t) {
        // filters out timespans not specified
        return timespanNames.indexOf(t.name) !== -1;
    });

    timespanNames.forEach(function(t) {
        $('input[data-timespan="' + t + '"]').prop('checked', true);
    });
}

function doSave() {
    // Validation
    var tempRefreshRate = $('#refresh_interval').val()
    if(tempRefreshRate < 10 || tempRefreshRate > 3600) {
        alert('Please input a value between 10 and 3600 for refresh rate')
        return false
    }

    // Refresh rate
    localStorage.setItem('refreshRate', tempRefreshRate)
    
    // Date Format
    localStorage.setItem('dateformat', $('#dateformat').val())

    // Time spans
    var timespanNames = [];
    $('input[type="checkbox"]:checked').each(function(i, c){
        timespanNames.push($(c).attr('data-timespan'));
    });
    localStorage.setItem('timespanNames', JSON.stringify(timespanNames))

    // Bitcoin Display Unit
    localStorage.displayUnitText = $('input[name="btcDisplayUnit"]:checked').val();
    btcDisplayUnitsModes.forEach(function(unit) {
        if(unit.name == localStorage.displayUnitText) {
            displayUnit = unit;
        }
    })

    // OutputCurrencyDisplayMode
    localStorage.outputCurrencyDisplayModeText = $('input[name="outputCurrencyDisplayMode"]:checked').val();
    if(validOutputCurrencyDisplayModes.indexOf(localStorage.outputCurrencyDisplayModeText) !== -1) {
        outputCurrencyDisplayMode = localStorage.outputCurrencyDisplayModeText;
    }
    
    //Effective rate calculation
    localStorage.effRateMode = $('input[name="effRateMode"]:checked').val();
    if(validEffRateModes.indexOf(localStorage.effRateMode) !== -1) {
        effRateMode = localStorage.effRateMode;
    }

    toastr.success("Settings saved!");
    $('#settings_modal').modal('hide');

    // Now we actually *use* these settings!
    update();
}

function update() {
    loadSettings();
    setEffRateMode();
    setBTCDisplayUnit();
    setOutputCurrencyDisplayMode();
    loadData();
    if (window.location.protocol == "file:") {
        $('#file').show();
    }
}

// https://github.com/twbs/bootstrap/issues/14040#issuecomment-253840676
function bsNavbarBugWorkaround() {
    var nb = $('nav.navbar-fixed-top');
    $('.modal').on('show.bs.modal', function () {
        nb.width(nb.width());
    }).on('hidden.bs.modal', function () {
        nb.width(nb.width('auto'));
    });
}

function coindetails(param,coin,status) {
        localStorage.setItem(coin,status);
        $(param).parent().parent().next('.coindetails').toggle();
        $(param).hide();
        $(param).siblings('.fa').toggle();
      }

$(document).ready(function () {
    toastr.options = {
        "positionClass": "toast-top-center"
    }

    update();
    bsNavbarBugWorkaround();
    
    $('.toggle').click(function(){
        $(this).hide();
        $(this).siblings().toggle();
        $(this).parent().next('.panel-body').toggle();
    });

    $( ".btn-success" ).click(function() {
        $( ".alert-success" ).closest('.row').toggle();
        $(this).toggleClass("disabled");
    });
    
    $( ".btn-info" ).click(function() {
        $( ".alert-info" ).closest('.row').toggle();
        $(this).toggleClass("disabled");
    });
    
    $( ".btn-danger" ).click(function() {
        $( ".alert-danger" ).closest('.row').toggle();
        $(this).toggleClass("disabled");
    });
    
    $( ".infobutton" ).click(function() {
        $( ".alert-custom" ).closest('.row').toggle();
        $(this).toggleClass("disabled");
    });   
    
	$('#dropdownMenuLink').html(localStorage.getItem('displayCurrency'));
	
	$('a[data-toggle="tab"]').on('show.bs.tab', function(e) {
        localStorage.setItem('activeTab', $(e.target).attr('href'));
    });

    var activeTab = localStorage.getItem('activeTab');
    if(activeTab){
        $('#navbarNav a[href="' + activeTab + '"]').tab('show');
    }
	
});


