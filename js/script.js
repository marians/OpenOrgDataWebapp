// time of last search
var lastSearch = null;

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
        submitSearch(State.data.q);
    });

})(window);

$(document).ready(function(){
	$('#searchform').submit(function(evt){
		evt.preventDefault();
		submitSearch($('#q').val());
	});
	$('#searchbutton').click(function(evt){
		evt.preventDefault();
		submitSearch($('#q').val());
	});
	resetStateCircles();

	if ($('#socialshareprivacy').length > 0){
		$('#socialshareprivacy').socialSharePrivacy({
			'cookie_domain' : 'openorgdata.sendung.de'
		});
	}

	// Erste Suche
	var q = getURLParam('q');
	if (q !== '' && q !== null && q !== undefined) {
		submitSearch(q);
	} else {
		submitSearch('');
	}
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

function submitSearch(q) {
	if ((lastSearch === null) || (microTime() - lastSearch) > 0.3) {
		lastSearch = microTime();
		showLoadIndicator();
		if (q !== '') {
			$('#q').val(q);
			_gaq.push(['_trackEvent', 'Search', 'SearchInput', q]);
		}
		var url = 'http://openorgdata.sendung.de/api/';
		var settings = {
			data: {
				q: q
			},
			cache: true,
			dataType: 'jsonp',
			success: function(data) {
				//console.log(data);
				showWordCloud(data.facets.nameterms);
				showStatesData(data.facets.states);
				showNumHits(data.hits.total);
				History.pushState({q: q}, "Suche nach " + q, '?q=' + q);
			}
		};
		$.ajax(url, settings);
	}
}

function microTime() {
	return new Date().getTime() + (new Date().getMilliseconds() / 1000.0);
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
	$('#wordcloud').append('<div id="wordcloudinner"></div>');
	//console.log("success:", data);
	if (data.terms.length === 0) return;
	var minSize = 100;
	var maxSize = 500;
	var maxCount = data.terms[0].count;
	var minCount = data.terms[ data.terms.length - 1 ].count;
	var size = 0;
	var el;
	$.each(data.terms, function(i,term){
		size = ((term.count / (maxCount - minCount)) * (maxSize - minSize)) + 100;
		el = $(document.createElement('span')).text(term.term);
		$('#wordcloudinner').append(el);
		//$('#wordcloudinner').append('<span style="font-size: ' + size + '%" title="' + term.count + ' Einträge">' + term.term + '</span> ');
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
	if (data.terms.length === 0) return;
	var maxValue = data.terms[0].count;
	var maxSize = 500;
	var size = 0;
	var eintrag = 'Einträge';
	$.each(data.terms, function(i, term){
		size = Math.sqrt((term.count / maxValue) * maxSize);
		console.log(term.count, maxValue, size);
		$('#circle_x5F_' + state_ids[term.term]).attr('r', size);
		if (term.count == 1) {
			eintrag = 'Eintrag';
		} else {
			eintrag = 'Einträge';
		}
		$('#circle_x5F_' + state_ids[term.term] + ' title').text(term.count + ' ' + eintrag);
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
		if ($('#circle_x5F_' + id + ' title').length === 0) {
			$('#circle_x5F_' + id).append('<title></title>');
		}
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

function getURLParam(name) {
	//name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
	var regexS = "[\\?&]" + name + "=([^&#]*)";
	var regex = new RegExp(regexS);
	var results = regex.exec(window.location.search);
	if (results === null) {
		return "";
	} else {
		return decodeURIComponent(results[1].replace(/\+/g, " "));
	}
}