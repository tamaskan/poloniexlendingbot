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
var Jsondata;
var accounttotal;
 
var mincoins = JSON.parse(localStorage.getItem('MinCoins')) || {'BTC':0.01,'BTS':10,'CLAM':10,'DASH':0.01,'DOGE':100,'ETH':0.01,'FCT':100,'LTC':0.01,'MAID':10,'STR':100,'XMR':0.01,'XRP':100};

function mincoincheck(exchange,coin,value){
	if(exchange == "BITFINEX"){
		//BITFINEX -> 50$
	}
    var response;
          if (mincoins[coin] && value >= mincoins[coin]) {response = value;}
          else if(mincoins[coin]) {response = '<a data-toggle="tooltip" style="color:red" class="plb-tooltip" title=" Minimum ' + mincoins[coin] + ' Coins ">' + value + '</a>';}
    return response || value;
}
   
function notification(string,type){

    if((moment().diff(moment(localStorage.getItem('last_updated')),'seconds') < ( localStorage.getItem('refreshRate') || 30)) || string.indexOf('Update') >= 0) {} else {return false;}
    
    if (localStorage.getItem('notificationOnUpdate')) {
        toastr.options = {"positionClass": "toast-top-right"}
        if(type == "success" || type == "update"){
           toastr.success(string);
        } else if (type == "warning") {
           toastr.error(string);        
        }
        else {
           toastr.info(string) 
        }     
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

function shorttimestring(timestring){
    if(localStorage.getItem('relativedates') != "true"){return timestring;}
        var time = moment(timestring,'YYYY-MM-DD h:mm:ss').format(dateformat);
        var shorttime;
        
        $.each(["years","months","weeks","days","hours","minutes","seconds"],function(key,value){
            if (moment().diff(moment(timestring,'YYYY-MM-DD h:mm:ss'),value) >= 1) {
               shorttime = '<a data-toggle="tooltip" data-date="'+timestring+'" class="plb-tooltip" title="' + time + '">' + moment().diff(moment(timestring,'YYYY-MM-DD h:mm:ss'),value) + ' ' + value + ' ago</a>';
               return false;
            }
        })
        
        return shorttime;
}

function timeleft(timestring){
        if(moment().isSameOrAfter(moment(timestring))){return false;}
        var time = moment(timestring,'YYYY-MM-DD h:mm:ss').format(dateformat);
        var shorttime;
        
        $.each(["years","months","weeks","days","hours","minutes","seconds"],function(key,value){
            if (timestring.diff(moment(moment(),'YYYY-MM-DD h:mm:ss'),value) >= 1) {
               shorttime = '<a data-toggle="tooltip" data-date="'+timestring+'" class="plb-tooltip" title="' + time + '">' + timestring.diff(moment(moment(),'YYYY-MM-DD h:mm:ss'),value) + ' ' + value + '</a>';
               return false;
            }
        })
        
        return shorttime;
}

 var coindataSet;
 
function updateJson(data) {
	
	coindataSet = [];
    Jsondata = data["raw_data"];
	$('.exchangefilter').empty();
	$('.exchangefilter').append("<option value=''>All</option>");
	 
	$.each(Jsondata,function(key,value){
		$('.exchangefilter').append("<option value=\""+key+"\">"+key+"</option>");
		
		switch(key){
		
		case "POLONIEX":
		  poloapi(value);
		  break;
		
		case "BITFINEX":
		  bitfinexapi(value);
		  break;
		}
	})
	
	function poloapi(data){
		$.get( "https://poloniex.com/public?command=returnTicker", function( poloniexdata ) {
        poloniexdata["BTC_BTC"] = {};
     $.each(poloniexdata,function(k,v){
      if (k.indexOf('BTC_') >=0) {
          var coin = k.replace("BTC_","");
          var highbid = v["highestBid"];
          $.each(Jsondata["POLONIEX"],function(key,value){
            
              if (key == coin) {
                  
                  Jsondata["POLONIEX"][key]["highestBid"] = Jsondata["POLONIEX"][key]["highestBid"] || highbid || 1;
                  Jsondata["POLONIEX"][key]["totalCoins"] = prettyFloat(+value["totalCoins"] || +value["maxToLend"],4);
                  Jsondata["POLONIEX"][key]["balance"] = prettyFloat(localStorage.getItem('displayCurrencyRate') * (Jsondata["POLONIEX"][key]["totalCoins"] * value["highestBid"]),2);
                  Jsondata["POLONIEX"][key]["interestcoin"] = Jsondata["POLONIEX"][key]["totalEarnings"] || 0;
                  Jsondata["POLONIEX"][key]["interest24h"] = prettyFloat(+Jsondata["POLONIEX"][key]["yesterdayEarnings"],8) || 0;
                  Jsondata["POLONIEX"][key]["interestcurrency"] = prettyFloat(Jsondata["POLONIEX"][key]["totalEarnings"] * value["highestBid"] * localStorage.getItem('displayCurrencyRate'),2);
			  
				  coindataSet.push([exchangeicon("POLONIEX",false), prettyFloat(Math.pow((+value["averageLendingRate"] * 0.85 / 100) + 1, 365) - 1,2) * 100 + " %",coinicon(key),value["totalCoins"],value["balance"],value["interest24h"],value["interestcoin"],value["interestcurrency"]]);
				  
              }
			  
          })
		  
      }
    
     }); 
	 rendertable();
    });
	}
	
	function bitfinexapi(data){
		var ticker = [];
		
		$.each(data,function(key,value){
			ticker.push("t" + key.toUpperCase()+"BTC");
		})

		   $.get( "https://api.bitfinex.com/v2/tickers?symbols="+ticker.toString() , function( data ) {
			$.each(data,function(key,value){
				var coin = value[0].substring(1,value[0].length-3);
				
				Jsondata["BITFINEX"][coin]["highestBid"] = Jsondata["BITFINEX"][coin]["highestBid"] || value[7] || 1;
                Jsondata["BITFINEX"][coin]["totalCoins"] = prettyFloat(+Jsondata["BITFINEX"][coin]["totalCoins"] || +Jsondata["BITFINEX"][coin]["maxToLend"],4);
                Jsondata["BITFINEX"][coin]["balance"] = prettyFloat(localStorage.getItem('displayCurrencyRate') * (Jsondata["BITFINEX"][coin]["totalCoins"] * Jsondata["BITFINEX"][coin]["highestBid"]),2);
                Jsondata["BITFINEX"][coin]["interestcoin"] = Jsondata["BITFINEX"][coin]["totalEarnings"] || 0;
                Jsondata["BITFINEX"][coin]["interest24h"] = prettyFloat(+Jsondata["BITFINEX"][coin]["yesterdayEarnings"],8) || 0;
                Jsondata["BITFINEX"][coin]["interestcurrency"] = prettyFloat(Jsondata["BITFINEX"][coin]["totalEarnings"] * Jsondata["BITFINEX"][coin]["highestBid"] * localStorage.getItem('displayCurrencyRate'),2);
				
				coindataSet.push([exchangeicon("BITFINEX",false), "<span class='coinforecast'>"+prettyFloat(Math.pow((+Jsondata["BITFINEX"][coin]["averageLendingRate"] * 0.85 / 100) + 1, 365) - 1,4) * 100 + " %</span>",coinicon(coin),Jsondata["BITFINEX"][coin]["totalCoins"],Jsondata["BITFINEX"][coin]["balance"],Jsondata["BITFINEX"][coin]["interest24h"],Jsondata["BITFINEX"][coin]["interestcoin"],Jsondata["BITFINEX"][coin]["interestcurrency"]]);
			})
			rendertable();
		   })
		
	}
	var rendered = 0;
	function rendertable(){
       rendered++;
	   if((rendered % 2) != 0){return false;}
	   if ( $.fn.dataTable.isDataTable( '#coinstatustable' ) ) {
         cointable = $('#coinstatustable').DataTable().columns.adjust().draw( false );
       }
       else {
         cointable = $('#coinstatustable').DataTable({data: coindataSet,"bPaginate": false,"bInfo" : false,responsive: true} );
	   }
	}
    
    $('.displayCurrency').each(function(){
        $(this).html(($(this).html().replace("$",localStorage.getItem("displayCurrency"))));
    })
    
	var successnumber = 0;
    var cancelednumber = 0;
    var errornumber = 0;
	var infonumber = 0;

    var logdataSet = [];
    
    var regexarray = [/(\d{4}[.-]\d{2}[.-]\d{2}[ ]\d{2}[:]\d{2}[:]\d{2})/,/[ ]\d{0,20}[.]\d{0,20}[ ]([A-Z]{0,10})[ ]/,/[ ](\d{0,20}[.]\d{0,20})[ ]/,/\bfor?\b[ ](\d{0,3}[ ]\bdays?\b)/,/(\d{0,4}[.]\d{0,18})[%]/];
	
for(exchange in data.log){
		
    var rowCount = data.log[exchange].length;
    localStorage.setItem('last_updated',data["last_update"]);
	
    for (var i = rowCount - 1; i >=0; i--) {
    
    var logstring = ((data.log[exchange][i]).match(regexarray[0]))[1];    
	var logdate = shorttimestring(logstring);
    var logmessage = data.log[exchange][i].replace(logstring,"");
	
    if((logmessage).indexOf("min_loan_size") >= 0){
       var coinobject = ((logmessage).match(/([A-Z]{0,5})'/))[1];
       var coinamountobject = ((logmessage).match(/: (\d{1,4}[\.]*\d*)/))[1];
       if(mincoins[coinobject] != coinamountobject) {
           mincoins[coinobject] = coinamountobject;
           localStorage.setItem("MinCoins",JSON.stringify(mincoins));
        };
    }   
        
        if (logmessage.indexOf("Error") >= 0) {
            if (localStorage.getItem('notificationOnError') == "true"){notification(logmessage,"warning");}
            logmessage = '<span data-type="table-danger">' + logmessage + '</span>';
            errornumber++;
            logdataSet.push([exchangeicon(exchange,false),"Error",logdate,logmessage.replace("Error: ","")]);
        }
        else if (logmessage.indexOf("Placing") >= 0) {
            if (localStorage.getItem('notificationOnLoan') == "true"){notification(logmessage,"success");}
            logmessage = '<span data-type="table-success">' +  coinicon(logmessage) + '</span>';
            successnumber++;
            logdataSet.push([exchangeicon(exchange,false),"Success",logdate,logmessage]);
        }
        else if (logmessage.indexOf("Canceling") >= 0) {
            logmessage = '<span data-type="table-info">' + logmessage + '</span>';
			logdataSet.push([exchangeicon(exchange,false),"Canceled",logdate,logmessage]);
            cancelednumber++;
            
        }
        else {
            logmessage = '<span data-type="table-custom">' +  coinicon(logmessage) + '</span>';
			logdataSet.push([exchangeicon(exchange,false),"Info",logdate,logmessage]);
			infonumber++;
        }      
        
    } 
    
	}

	updateOutputCurrency(data.outputCurrency);
    updateRawValues(data.raw_data);
	
    $('#successnumber').bootstrapSwitch('onText', successnumber);
	$('#cancelednumber').bootstrapSwitch('onText', cancelednumber);
	$('#errornumber').bootstrapSwitch('onText', errornumber);
	$('#infonumber').bootstrapSwitch('onText', infonumber);	
	
    if ( $.fn.dataTable.isDataTable( '#logtable' ) ) {
       logtable = $('#logtable').DataTable().columns.adjust().draw( false );
    }
    else {
       logtable = $('#logtable').DataTable({data: logdataSet,responsive: true,createdRow: function( row, data, dataIndex ) {
          $( row ).find('td:eq(1) a').attr('data-order',$( row ).find('td:eq(1) a').attr('data-date'));
          $( row ).addClass($( row ).find('td:eq(2) span').attr('data-type'));        
        }});
    }

}

function exchangeicon(exchange,icononly){
	if (exchange == "POLONIEX" && icononly == false){return '<img src="images/POLONIEX.ico" style="width:18px;height:18px;margin-right:5px;line-height:18px">' + exchange}
	if (exchange == "BITFINEX" && icononly == false){return '<img src="images/BITFINEX.ico" style="width:18px;height:18px;margin-right:5px;line-height:18px">' + exchange}
	if (exchange == "POLONIEX" && icononly == true){return '<img src="images/POLONIEX.ico" style="width:18px;height:18px;margin-right:5px;line-height:18px">'}
	if (exchange == "BITFINEX" && icononly == true){return '<img src="images/BITFINEX.ico" style="width:18px;height:18px;margin-right:5px;line-height:18px">'}
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

function updateRawValues(rawData){
    var table = document.getElementById("detailsTable");
    table.innerHTML = "";
    var currencies = Object.keys(rawData);
    var totalBTCEarnings = {};
	
var dataSet = [];
var coinlist = "";
$('.loanfilter').empty();
$('.loanfilter').append("<option value=''>All</option>");
var loanarray = {};

for (exchange in rawData) {
 var currencies = Object.keys(rawData[exchange]);
	
    for (var keyIndex = 0; keyIndex < currencies.length; ++keyIndex)
    {
        var currency = currencies[keyIndex];
        var btcMultiplier = currency == 'BTC' ? displayUnit.multiplier : 1;
        var averageLendingRate = parseFloat(rawData[exchange][currency]['averageLendingRate']);
        var lentSum = parseFloat(rawData[exchange][currency]['lentSum']);
        var totalCoins = parseFloat(rawData[exchange][currency]['totalCoins'] || rawData[exchange][currency]['maxToLend']);
        var maxToLend = parseFloat(rawData[exchange][currency]['maxToLend']);
        var highestBidBTC = parseFloat(rawData[exchange][currency]['highestBid']);

		// https://github.com/emilam/poloniexlendingbot/commit/8ac76573651855b43ab193dcf46e1e16144ac704
		if(rawData[exchange][currency]["allLoans"] && rawData[exchange][currency]["allLoans"].length > 0){
			loanarray[currency] = "";
			for (var i = 0; i < rawData[exchange][currency]["allLoans"].length; ++i) {
			   var loan = rawData[exchange][currency]["allLoans"][i];
			   dataSet.push([exchangeicon(exchange,false),coinicon(currency),loan["duration"]+" days",timeleft(moment(loan["date"]).add(loan["duration"],'days')),loan["amount"],prettyFloat(parseFloat(loan["rate"]) * 100, 3) +" %",loan["amount"]*loan["rate"] + " " +currency]);
			   
		}}
		
        if (currency == 'BTC') {
            // no bids for BTC provided by poloniex
            // this is added so BTC can be handled like other coins for conversions
            highestBidBTC = 1;
        }
        var couple = rawData[exchange][currency]['couple'];

        if (!isNaN(averageLendingRate) && !isNaN(lentSum) || !isNaN(totalCoins))
        {

            
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
               
            if(yearlyRateComp > 0){
                localStorage.setItem('yearlyrate'+currency,(+localStorage.getItem('yearlyrate'+currency) + printFloat(yearlyRateComp, 2) / 2));
            } else {
                yearlyRateComp = localStorage.getItem('yearlyrate'+currency);
            }
                                  
            if (lentSum > 0) {
               var detaildown = (localStorage.getItem(displayCurrency) == "true") ? 'none' : '';
               var detailup = (localStorage.getItem(displayCurrency) == "true") ? '' : 'none';
            } else {
				var detaildown = "none";
				var detailup = ";color:transparent;";  
            }
          
			var earnings = '<div class="col-4">' + earnings + '</div>';
			var earningsSummaryCoin = '<div class="col-4">' + earningsSummaryCoin + '</div>';
			var calculation = "<div class='col-4'>" + printFloat(averageLendingRate, 5) + '% Day' + avgRateText + '</br>'
                   +  printFloat(effectiveRate, 5) + '% Day' + effRateText + '</br>'
                   +  printFloat(yearlyRate, 2) + '% Year' + '</br>'
                   +  printFloat(yearlyRateComp, 2) + '% Year' + compoundRateText + "</div>" ;
			
			var lentStr = '<div class="progress col"><div class="progress-bar bg-success" role="progressbar" aria-valuenow="'+printFloat(lentPerc, 2)+'" aria-valuemin="0" aria-valuemax="100" style="width:'+printFloat(lentPerc, 2)+'%">'+printFloat(lentPerc, 2)+'</div></div>';
			
			var card= '<div class="card" style="width:100%"><div class="card-header row">';
			
			var header = '<span class="col" style="text-align:left">' + exchangeicon(exchange,true) + coinicon(displayCurrency) + '</span>' + lentStr + '<span style="text-align:center;white-space:nowrap;" class="col hidden-sm-down">Lent ' + printFloat(lentSum * btcMultiplier, 4) +' of ' + mincoincheck(exchange,displayCurrency,printFloat(totalCoins * btcMultiplier, 4)) + ' (' + printFloat(lentPerc, 2) + '%)</span>' + '<span class="fa fa-chevron-down col" style="text-align:center;display:'+detaildown+'" ></span><span class="fa fa-chevron-up col" style="text-align:center;display:'+detailup+'" ></span>';
            
			if(localStorage.getItem(displayCurrency) == "true") {
               var dropdown = '</div><div class="card-block coindetails row ' + displayCurrency + '">' + earnings + earningsSummaryCoin + calculation +  '</div></div>';
            } else {
               var dropdown = '</div><div class="card-block coindetails row ' + displayCurrency + '" style="display:none">' + earnings + earningsSummaryCoin + calculation + '</div></div>';
            }

			coinlist += '<div class="row  justify-content-md-center" >' + card + header + dropdown + '</div>';
            
        }
		
}}

   $('#coindetails').html(coinlist);
   
   $.each(loanarray,function(key,value){
	   $('.loanfilter').append("<option value=\""+key+"\">"+key+"</option>");
   });
   
	if ( $.fn.dataTable.isDataTable( '#openloans' ) ) {
       mydatatable = $('#openloans').DataTable().columns.adjust().draw( false );
    }
    else if (dataSet.length > 0) {
       mydatatable = $('#openloans').DataTable({data: dataSet,responsive: true,createdRow: function( row, data, dataIndex ) {
          $( row ).find('tr').addClass($( row ).find('td:eq(2) span').attr('data-type'));
        }});
    }

    // show account summary
    if (currencies.length > 1 || summaryCoin != earningsOutputCoin) {
        earnings = '';
        timespans.forEach(function(timespan) {
            earnings += timespan.formatEarnings( summaryCoin, totalBTCEarnings[timespan.name] * summaryCoinRate);
            
        });
		$('#coindetails').prepend("<div style='margin-top:20px;margin-bottom:20px;'>Estimated Earnings <br/>" + earnings + "</div>");
    }
    
    

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
        // expect the botlog.json to be in the same folder on the webserver -> https://github.com/BitBotFactory/poloniexlendingbot/pull/435/files
        var file = ['botlog.json','botlog2.json'];
			$.getJSON(file[1], function (seconddata) {
				$.getJSON(file[0], function (data) {
					var firstdata = data["raw_data"];
					delete data["raw_data"];
					data["raw_data"] = {};
					data["raw_data"][data["exchange"]] = firstdata;	
					data["raw_data"][seconddata["exchange"]] = seconddata["raw_data"];
					
					var firstlog = data["log"];
					delete data["log"];
					data["log"] = {};
					data["log"][data["exchange"]] = firstlog;
					data["log"][seconddata["exchange"]] = seconddata["log"];
					delete data["exchange"];
				    updateJson(data);
				     //reload every 30sec
				    setTimeout('loadData()', refreshRate * 1000)
			    }).fail( function(d, textStatus, error) {
				   $('#status').text("getJSON failed, status: " + textStatus + ", error: "+error);
				   // retry after 60sec
				   setTimeout('loadData()', 60000)
			    });
        }).fail(function(){
		     $.getJSON(file[0], function (data) {
				updateJson(data);
				// reload every 30sec
				setTimeout('loadData()', refreshRate * 1000);
			 }).fail( function(d, textStatus, error) {
				$('#status').text("getJSON failed, status: " + textStatus + ", error: "+error);
				// retry after 60sec
				setTimeout('loadData()', 60000)
			});
		})
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
    
    

$('input.switchradio,input.logswitch').each(function(key,value){
    if(value.id){
            $("#"+value.id).bootstrapSwitch('state',JSON.parse(localStorage.getItem(this.id)) || false);
    }   
})
    
$('input.switchradio,input.logswitch').on('switchChange.bootstrapSwitch', function (event, state) {
    if(this.id){
        localStorage.setItem(this.id,$("#"+this.id).bootstrapSwitch('state'));
    }   
});

$('input.logswitch').on('switchChange.bootstrapSwitch', function (event, state) {
    if(this.id){
		if($.fn.dataTable.isDataTable( '#logtable' )){
			
			var searchstring = [];
		   $('input.logswitch').each(function(){
			   if ($(this).bootstrapSwitch('state')) {searchstring.push($(this).data("off-text"));}
		   })
		   if($('.exchangefilter').val()) {searchstring.push($('.exchangefilter').val())};
		   searchstring = searchstring.toString().replace(/,/g,"|");
           logtable.columns( 1 ).search(searchstring,true).draw(false);
        } 
    }   
});

$('#dropdownMenuButton').on('change', function() {
  if($.fn.dataTable.isDataTable( '#logtable' )){
	  logtable.columns( 0 ).search(this.value).draw(false);
  } 
})

$('.loanfilter').on('change', function() {
  if($.fn.dataTable.isDataTable( '#openloans' )){
	  mydatatable.columns( 1 ).search(this.value).draw(false);
  } 
})


$('#coinstatustable tbody').on('click', '.coinforecast', function () {
        var data = cointable.row( $(this).closest('tr') ).data();
		coinforecast(data[2].split("> ")[1] || data[2],data[3],$(data[1]).text());
    } );

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

    notification("Settings saved!","success");

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

function coindetails(param,coin,status) {
        localStorage.setItem(coin,status);
        $(param).parent().parent().next('.coindetails').toggle();
        $(param).hide();
        $(param).siblings('.fa').toggle();
      }

	  
//Coin-Forecast
var ctx = $("#myChart");
var chart = "";

function coinforecast(coinname,amount,rate){ 

   var coinyears = [];
   var year = moment().year();
   var yeararray = [];
   
   for (var n = 0; n < 5; ++ n) {
      coinyears[n] = parseFloat(amount + (amount * (rate.replace(" %","") / 100)));
      amount = coinyears[n];
      year = year + 1;
      yeararray.push(year);
   } 

   var $inspector = $("<i class='cc'>").css('display', 'none').addClass(coinname);
   
   $("body").append($inspector); 
   
   try {
      coincolor = $inspector.css('color');
   } finally {
      $inspector.remove(); 
   }
            
data = { labels: yeararray,datasets: [{label: coinname,backgroundColor: coincolor,borderColor: coincolor,data: coinyears,fill: false}] };
                
chart = new Chart(ctx, {
    type: 'line',
    data: data,
    options: {
        scales: {
            xAxes: [{
                time: {
                    unit: 'years'
                },
                scaleLabel: {
                    display: true,
                    labelString: 'Date'
                }
            }]
        }
    }
})
$('#coinforecast').modal('toggle');
}     
// <!--Coin-Forecast-->  
   
$(document).ready(function () {
    toastr.options = {
        "positionClass": "toast-top-center"
    }

    update();
    
    $('#dropdownMenuLink').html(localStorage.getItem('displayCurrency'));
    
    $('a[data-toggle="tab"]').on('show.bs.tab', function(e) {
        localStorage.setItem('activeTab', $(e.target).attr('href'));
    });
    
    $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
     if($(e.target).attr("href") == "#logtab"){
         $( document ).ready(function() {
                if($.fn.dataTable.isDataTable( '#logtable' )){
                    logtable.columns.adjust().draw(false);
                }    
             });
     } 
    })

    var activeTab = localStorage.getItem('activeTab');
    if(activeTab){
        $('#navbarNav a[href="' + activeTab + '"]').tab('show');
    }
    
    jQuery(".switchradio,.logswitch").bootstrapSwitch();
    
    $.get( "https://blockchain.info/ticker?cors=true", function( data ) {
     $.each(data,function(v,m){
      $('#currencydropdown').append('<a class="dropdown-item" href="#" data-name="'+v+'" data-value="'+m['last']+'">'+v+'</a>');
     });
    });
    
    localStorage.setItem("displayCurrency",localStorage.getItem("displayCurrency") || "BTC");
    localStorage.setItem("displayCurrencyRate",localStorage.getItem("displayCurrencyRate") || 1);
    
    $(document.body).on('click',".dropdown-item",function(){
       localStorage.setItem("displayCurrency",$(this).data("name"));
       localStorage.setItem("displayCurrencyRate",$(this).data("value"));
       window.location.reload(true);
    });
	
	$(document).on('click','.fa-chevron-up,.fa-chevron-down',function(){
	   $(this).toggle().siblings('.fa').toggle();
	   $(this).closest('.card').find('.coindetails').toggle();
	})
	
	
	
});