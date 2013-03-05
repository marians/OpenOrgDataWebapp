// time of last search
var lastSearch = null;

// currently highlighted circle ID
var currentHighlight = null;

// search result data
var resultData = null;

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

	// Mouse-handler für Tooltip
	d3.select('svg').on('mousemove', mouseMoveHandler);
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
// short versions of long labels
var labelAbbrev = {
	'Mecklenburg-Vorpommern': 'Mecklenb.-Vorp.',
	'Brandenburg': 'BB'
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
				resultData = data;
				//console.log(data);
				showWordCloud(data.facets.nameterms);
				showStatesData(data.facets.states);
				showNumHits(data.hits);
				History.pushState({q: q}, "OpenOrgData: " + q, '?q=' + q);
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
	//$('#states').empty();
	$('#numhits').empty();
	$('#wordcloud').append('<div class="loading"><div class="loadinginner">Lade Daten...</div></div>');
	//$('#states').append('<div class="loading"><div class="loadinginner">Lade Daten...</div></div>');
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
	var minSize = 14;
	var maxSize = 36;
	var maxCount = data.terms[0].count;
	var minCount = data.terms[ data.terms.length - 1 ].count;
	var size = 0;
	var el;
	$.each(data.terms, function(i,term){
		//size = ((term.count / (maxCount - minCount)) * (maxSize - minSize)) + 100;
		size = ((term.count / (maxCount - minCount)) * (maxSize - minSize)) + minSize;
		el = $(document.createElement('a'));
		el.text(term.term).css({'font-size': Math.round(size) + 'px', 'line-height': Math.round(size + 4) + 'px'});
		el.attr('title',  term.count + ' Einträge');
		el.attr('href', '#');
		el.click(function(evt){
			evt.preventDefault();
			submitSearch(term.term);
		});
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
	if (data.terms.length === 0) return;
	var maxValue;
	var useRelativeValues = true;
	var maxSize;
	if (useRelativeValues) {
		maxSize = 5000;
		maxValue = data.density_max;
	} else {
		maxSize = 5000;
		maxValue = data.terms[0].count;
	}
	var size = 0;
	var val;
	var statesDone = {};
	$.each(data.terms, function(i, term){
		if (useRelativeValues) {
			val = term.density;
		} else {
			val = term.count;
		}
		size = Math.sqrt((val / maxValue) * maxSize);
		d3.select('#circle_x5F_' + term.state_id)
			.attr('class', 'active')
			.transition()
			.attr('opacity', '0.7')
			.attr('r', size);
		statesDone[term.state_id] = true;
	});
	// set rest to zero size and inactive
	$.each(state_ids, function(i, state_id){
		if (!statesDone[state_id]) {
			d3.select('#circle_x5F_' + state_id)
				.transition()
				.attr('r', '0')
				.attr('opacity', '0')
				.attr('class', 'inactive');
				
		}
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
	d3.selectAll('svg circle').attr('class', 'inactive');
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

/**
 * Decides whether or not to show a tooltip, and if yes,
 * which one and where.
 */
function mouseMoveHandler() {
	var mpos = d3.mouse(this);
    //console.log(coordinates);
    var maxDist = 200;
    var nearestDist = 1000000;
    var nearestId = null;
    var circle;
	d3.selectAll('svg circle.active').each(function(){
		circle = d3.select(this);
		dist = distance(mpos[0], mpos[1], circle.attr('cx'), circle.attr('cy'));
		//console.log(circle.attr('id'), dist);
		if (dist < maxDist && dist < nearestDist) {
			nearestDist = dist;
			nearestId = circle.attr('id');
		}
	});
	//console.log('mouse:', mpos, 'nearest:', nearestId, 'distance:', nearestDist);
	if (nearestId != currentHighlight) {
		setCurrentHighlight(nearestId);
	}
	
}

/** Calculate distance between two points
 */
function distance(x1, y1, x2, y2) {
	var xdiff = Math.abs(x1 - x2);
	var ydiff = Math.abs(y1 - y2);
	return Math.round(Math.sqrt(xdiff*xdiff + ydiff*ydiff));
}

/**
 * Set currently highlighted circle to the given ID.
 * If id is null, highlight is turned off.
 */
function setCurrentHighlight(hlid) {
	//console.log('setCurrentHighlight called with id', hlid);
	// reset currently highlighted circle
	if (currentHighlight) {
		d3.select('#' + currentHighlight).transition().attr('opacity', '0.7');
	}
	// set the global var
	currentHighlight = hlid;
	if (currentHighlight === null) {
		d3.select('svg g#tooltip').remove();
		return;
	}
	// highlight circle and draw stuff
	var hl = d3.select('#' + currentHighlight);
	hl.transition().attr('opacity', '1.0');
	// flag position
	var idparts = currentHighlight.split('x5F_');
	var x = hl.attr('cx');
	var y = hl.attr('cy');
	var r = hl.attr('r');
	y = y - r - 35;
	var tooltip = d3.select('svg g#tooltip');
	var label;
	var rect = d3.select('g#tooltip rect.hllabel');
	var textWidth = 100;
	if (tooltip[0][0]) {
		// already exists
		label = tooltip.select('text.hllabel');
		label.text(getLabelForId(idparts[1]));
		textWidth = label.node().getComputedTextLength();
		rect.attr('width', textWidth + 50);
		// move to new position
		tooltip.transition().attr('transform', function(d) {
			return "translate(" + x + "," + y + ")";
		});
	} else {
		// create label
		tooltip = d3.select('svg').append('g')
			.attr('id', 'tooltip')
			.attr('transform', 'translate('+ x +','+ y +')');
		rect = tooltip.append('rect')
			.attr('class', 'hllabel')
			.attr('width', textWidth + 30)
			.attr('height', 50)
			.attr('dx', 0).attr('dy', 0);
		label = tooltip.append('text')
			.attr('class', 'hllabel')
			.attr('dx', 20).attr('dy', 33)
			.text(getLabelForId(idparts[1]));
		textWidth = label.node().getComputedTextLength();
		rect.attr('width', textWidth + 40);
	}

}

/**
 * Return the name for the given location identifier
 * (e.g. "th" for Thüringen)
 */
function getLabelForId(idstr) {
	var name = '';
	var value = '';
	for (var i in state_ids) {
		//console.log(idstr, i, state_ids[i]);
		if (state_ids[i] == idstr) {
			name = i;
		}
	}
	var el;
	for (var t in resultData.facets.states.terms) {
		el = resultData.facets.states.terms[t];
		if (el.state_id == idstr) {
			value = el.count + " aus " + el.all;
		}
	}
	if (labelAbbrev[name]) {
		name = labelAbbrev[name];
	}
	return name + ': ' + value;
}

