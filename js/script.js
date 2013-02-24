
(function(window,undefined){

    // Prepare
    var History = window.History; // Note: We are using a capital H instead of a lower h
    if ( !History.enabled ) {
        return false;
    }

    // Bind to StateChange Event
    History.Adapter.bind(window,'statechange',function() {
        var State = History.getState();
        //console.log(State.data, State.title, State.url);
        $('#q').val(State.data.q);
    });

})(window);

$(document).ready(function(){
	$('#searchform').submit(function(evt){
		evt.preventDefault();
		submitSearch();
	});
	$('#searchbutton').click(function(evt){
		evt.preventDefault();
		submitSearch();
	});
	resetStateCircles();
});

var state_ids = {
	'Baden-Württemberg': 'bw',
	'Bayern': 'by',
	'Berlin': 'be',
	'Brandenburg': 'bb',
	'Bremen': 'hb',
	'Hamburg': 'hh',
	'Hessen': 'he',
	'Mecklenburg-Vorpommern': 'mv',
	'Niedersachsen': 'ni',
	'Nordrhein-Westfalen': 'nw',
	'Rheinland-Pfalz': 'rp',
	'Saarland': 'sl',
	'Sachsen': 'sn',
	'Sachsen-Anhalt': 'st',
	'Schleswig-Holstein': 'sh',
	'Thüringen': 'th'
};

function submitSearch() {
	showLoadIndicator();
	var q = $('#q').val();
	_gaq.push(['_trackEvent', 'Search', 'SearchInput', q]);
	History.pushState({q: q}, "Suche nach " + q, q);
	var url = 'http://openorgdata.sendung.de/api/';
	var settings = {
		data: {
			q: q
		},
		dataType: 'jsonp',
		success: function(data) {
			//console.log(data);
			showWordCloud(data.facets.nameterms);
			showStatesData(data.facets.states);
			showNumHits(data.hits.total);
		}
	};
	$.ajax(url, settings);
}

/**
 * Zeigt an den relevanten Stellen einen "Loading" indicator an.
 */
function showLoadIndicator() {
	$('#wordcloud').empty();
	$('#states').empty();
	$('#numhits').empty();
	$('#wordcloud').append('<div class="loading"><div class="loadinginner">Lade Daten...</div></div>');
	$('#states').append('<div class="loading"><div class="loadinginner">Lade Daten...</div></div>');
}

/**
 * Zeige die WordCloud der enthaltenen Begriffe
 *
 * @param data Result-Objekt von der API
 */
function showWordCloud(data) {
	$('#wordcloud').empty();
	$('#wordcloud').append('<div id="wordcloudinner"></div>')
	//console.log("success:", data);
	if (data.terms.length == 0) return;
	var minSize = 100;
	var maxSize = 500;
	var maxCount = data.terms[0].count;
	var minCount = data.terms[ data.terms.length - 1 ].count;
	var size = 0;
	$.each(data.terms, function(i,term){
		size = ((term.count / (maxCount - minCount)) * (maxSize - minSize)) + 100;
		$('#wordcloudinner').append('<span style="font-size: ' + size + '%" title="' + term.count + ' Einträge">' + term.term + '</span> ');
	});
}

/**
 * Zeige die Statistik je Bundesland
 *
 * @param data Result-Objekt von der API
 */
function showStatesData(data) {
	$('#states').empty();
	resetStateCircles();
	if (data.terms.length == 0) return;
	var maxValue = data.terms[0].count;
	var maxSize = 300;
	var size = 0;
	$.each(data.terms, function(i, term){
		size = Math.sqrt((term.count / maxValue) * maxSize);
		$('#circle_x5F_' + state_ids[term.term]).attr('r', size);
	});
}

function showNumHits(data) {
	//console.log(data);
	var str = 'Einträge';
	if (data == 1) {
		str = 'Eintrag';
	}
	$('#numhits').text(numberFormat(data) + ' ' + str);
}

function resetStateCircles() {
	$.each(state_ids, function(i, id){
		$('#circle_x5F_' + id).attr('r', '0');
	});
}

/**
 * Returns a user-friendly number string for
 * the German locale
 */
function numberFormat(nStr) {
	nStr += '';
	x = nStr.split('.');
	x1 = x[0];
	x2 = x.length > 1 ? '.' + x[1] : '';
	var rgx = /(\d+)(\d{3})/;
	while (rgx.test(x1)) {
		x1 = x1.replace(rgx, '$1' + '.' + '$2');
	}
	return x1 + x2;
}