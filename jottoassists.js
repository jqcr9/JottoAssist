
// Copyright (c) 2015 John A. Crown
// GNU General Public License

// todos:
// "already guessed this word" checking
// "already guessed an anagram of this word" checking
var MARKOUTMASK = 0x80000000  ;
var ALPHA26MASK = 0x03ffffff  ;
var guesslist = [] ;
// var roundnum = 1 ;
var currentroundnum = 1 ; // when Submit button is clicked, it is for this round
var allons  ;
var alloffs ;
var trivially_excluded_letters = 0 ;
var minimal_included_letters_test = 0 ;
var seenletters ;
var partitions_lists = {} ;
var partitions_vectors = {} ;
var separations ;
var separations_string ;
var rules_dictionary = {} ;
var current_rule ;
var null_errmsg = "<null errmsg>";
var curline_errmsg = "null_errmsg";
var currentround_errorflag = 0;

var dictionary_html = "" ;
var dictionary_entries = 0 ;
var cardinality5_opt = {} ;
var card5buildtimeval ;
var mask_aeiouy
var mask_crwth
var debug_mode = 1
var secretword ;
var GAME=1 ;  // computer picks the secret word
var ADVISOR=2 ; // user is playing against a third party, so enters the number of matching letters for each round
var game_mode = GAME;
 game_mode = ADVISOR ;
var test_mode = 0;

// where to store the dictionary selection into the guesses list:
var elt_input_for_subbutton;

var QueryString = function () {
  // This function is anonymous, is executed immediately and 
  // the return value is assigned to QueryString!
  var query_string = {};
  var query = window.location.search.substring(1);
  var vars = query.split("&");
  for (var i=0;i<vars.length;i++) {
    var pair = vars[i].split("=");
        // If first entry with this name
    if (typeof query_string[pair[0]] === "undefined") {
      query_string[pair[0]] = pair[1];
        // If second entry with this name
    } else if (typeof query_string[pair[0]] === "string") {
      var arr = [ query_string[pair[0]], pair[1] ];
      query_string[pair[0]] = arr;
        // If third or later entry with this name
    } else {
      query_string[pair[0]].push(pair[1]);
    }
  } 
    return query_string;
} ();

function myJottoOnLoad(){
    "use strict";
    populate_cardinality5_dictionary();
    console.log ("querystr mode: ", QueryString.mode)
    game_mode = GAME;
    test_mode = 0;
    if(QueryString.mode == "advisor") {
        game_mode = ADVISOR ;
    }
    if(QueryString.mode == "test" || QueryString.mode == "testmode") {
        if(QueryString.secretword === undefined) {
            console.log("WARNING: to use testmode, a secretword parameter must be provided (setting mode to GAME mode)");
        } else {
            game_mode = GAME ;
            test_mode = 1;
            secretword = QueryString.secretword ;
            console.log ("NOTE: secretword is \""+secretword+"\"")
            var secretword_len = secretword.length
            if(secretword_len == 5) {
                var secretword_bitvec = string_to_bitvector(secretword) ;
                console.log ("bitvec ",secretword_bitvec) ;
                var secretword_distinct_count = onset_cardinality(secretword_bitvec) ;
                if(secretword_distinct_count != 5) {
                    console.log("ERROR: secretword parameter must be 5 distinct characters, is "+secretword_distinct_count+" (ignoring)");
                    test_mode = 0;
                }
            } else {
                console.log("ERROR: secretword parameter must be 5 characters long, is "+secretword_len+" (ignoring)");
                test_mode = 0;
            }
        }
    }
    init_all_new_game();
    update_letterboard();
    update_separations();
    update_rules();
    guesslist = [] ;
    update_guesses_from_guesslist();
    clearDictionary();
    populate_dictionary(dictionary_list);

//    console.log("begin test card5dictionary:")
    var word001 = 16
    var myval = cardinality5_opt[word001]
    mask_aeiouy = string_to_bitvector("aeiouy")
    mask_crwth = string_to_bitvector("crwth")
//    console.log("added to cardinality5_opt[16]", word001, myval)
//    console.log("__end test card5dictionary:")
}

function startANewGame() { // button handler
    "use strict";
    myJottoOnLoad();
//    init_all_new_game();
}

function init_all_new_game() {
    "use strict";
    curline_errmsg = "";
    guesslist = []
    currentroundnum = 1;
    allons = 0;
    alloffs = 0;
    trivially_excluded_letters = 0
    minimal_included_letters_test = 0
    seenletters = 0 ;
    partitions_lists = {} ;
    partitions_vectors = {} ;
    separations = []
    separations_string = "abcdefghijklmnopqrstuvwxyz"
    rules_dictionary = {}
    rules_dictionary["5abcdefghijklmnopqrstuvwxyz"] = [65780];

    var dictionary_wordcount = dictionary_list.length;
    var randomnumber=Math.floor(Math.random()*(dictionary_wordcount+1))
    if(GAME == game_mode ) {
        if(test_mode == 0) {
            secretword  = dictionary_list[randomnumber]
        }
        console.log("The secret jotto word is", secretword);
    }
}    

function populate_cardinality5_dictionary() {
    "use strict";
    // build a dictionary (hash) of 83682 entries from which I can look up
    // the number of bits that are set (equal to 1) in a word of 26 bits,
    // as long as the answer is going to be 0, 1, 2, 3, 4, or 5
    var starttime = Date.now();
    starttime /= 1000
//    console.log("begin building card5dictionary: ---------- ", starttime);
    for (card5buildtimeval = 0; card5buildtimeval <= 5; card5buildtimeval++) {
        get_combinations(0, 26, card5buildtimeval, card5_entry_insert);
    }
    var endtime = Date.now() ;
    endtime /= 1000
//    console.log("__end building card5dictionary:", endtime);
}

function card5_entry_insert(aval) {
    "use strict";
    // console.log("add to cardinality5_opt", aval, " ", card5buildtimeval)

    cardinality5_opt[aval] = card5buildtimeval;
    if(aval == 16) {
//        console.log("add to cardinality5_opt", aval, " ", card5buildtimeval)
        var myval = cardinality5_opt[16];
//        console.log("added to cardinality5_opt[16]", myval)
        
    }
}

function init_new_round_helps() {
    "use strict";
    allons = 0;
    alloffs = 0;
    seenletters = 0 ;
    partitions_lists = {} ;
    partitions_vectors = {} ;
    separations = []
    separations_string = "abcdefghijklmnopqrstuvwxyz"
    rules_dictionary = {}
}

function myJottoAssistSubmit() { // button handler
    "use strict";
    if(GAME == game_mode) {
        // we need to come up with the count for the most-recent guess
    }
    curline_errmsg = "";
    
    update_guesses_list_from_html();
    init_new_round_helps();

    get_partitions_lists(); // test vectors, too
    var unused_output____seps = get_separations();

    // prepare for the analysis by pre-computing a bit-vector for each guessed word
    trivially_excluded_letters = 0
    minimal_included_letters_test = 0
    if(guesslist.length != currentroundnum) {
        console.log("INTERNAL FAIL blurp, currentroundnum vs. guesslist.length ",currentroundnum,guesslist.length);
    }
//    for (var qjx = 0; qjx < guesslist.length; qjx++) {
    var errorcount = 0;
    for (var qjxz = 0; qjxz <= currentroundnum - 1 ; qjxz++) {
        console.log ("XYZ1: qjxz");

        var gp = guesslist[qjxz] ;
        var guessword = gp[0] ;
        guessword = guessword.trim(); // trim lead/trail whitespace
        var card_g = gp[1];
        var guessword_len = guessword.length

        if(qjxz == currentroundnum-1) {
            if(word_guessed(guessword, 1)) {
                errorcount += 1;
                console.log("ERROR (vetted): guessword ", guessword," has already been guessed!");
                curline_errmsg = "the word \"" + guessword + "\" has already been guessed" ;
            } else {
                // as a courtesy, reject any anagram of a previous guess
                // except that when we get to 5 letters matching, we have to let them keep guessing anagrams until they hit the secretword
                if(GAME === game_mode) {
                    var anagramword ;
                    var n_matches = get_count_from_current_guess_v_secretword(secretword, guessword);
                    if(n_matches != 5) {
                        anagramword = is_anagram_of_previous_guess( guessword, 1);
                        if(anagramword != "") {
                            errorcount += 1;
                            console.log("ERROR (vetted): guessword ", guessword," in an anagram of a previous guess (\""+anagramword+"\")!");
                            curline_errmsg = "\"" + guessword + "\" is an anagram of the previous guess \""+ anagramword +"\"!" ;
                        }
                    }
                }
            }
        }

        if(guessword_len != 5) {
            errorcount += 1;
            console.log("ERROR (vetted): guessword ", guessword," is not 5 letters");
            curline_errmsg = "guessed word must contain 5 letters (guess has only "+guessword_len+" letters)"
        }
        var guessword_bitvec = string_to_bitvector(guessword) ;
        var guess_distinct_count = onset_cardinality(guessword_bitvec)
        if(guess_distinct_count != 5) {
            errorcount += 1;
            console.log("ERROR (vetted): guessword ", guessword," is not 5 distinct letters");
            curline_errmsg = "guessed word \""+guessword + "\" must contain 5 distinct letters"
        }
        gp[2] = guessword_bitvec ;
        seenletters |= guessword_bitvec
        if(card_g == 0) {
            // all the letters in this guess are trivally rejected from the solution
            trivially_excluded_letters |= guessword_bitvec;
        } else {
            minimal_included_letters_test |= guessword_bitvec;
        }
    }
    if(errorcount == 0) {
        currentroundnum += 1
        currentround_errorflag = 0;
        console.log ("CURRENTROUNDNUM: "+currentroundnum);
    } else {
        currentround_errorflag = 1;
    }

    {
        init_guesses_analysis();
        get_combinations(0, 26, 5, log_combo5);
    }

    update_letterboard();
    update_separations();
    update_rules();
    update_guesses_from_guesslist();
    clearDictionary();
    populate_dictionary(dictionary_list);

    for (var qx_z = 0; qx_z < (currentroundnum - 1); qx_z++) {
        var glitem = guesslist[qx_z] ;
        var guessword = glitem[0] ;
        var guesscount = glitem[1] ;
        console.log ("Done Submit ...",guessword, guesscount);
    }

    return;
}

function init_guesses_analysis() {
    "use strict";
    allons = ALPHA26MASK ;
    alloffs = ALPHA26MASK ;
}

function update_guesses_from_guesslist() {
    "use strict";
    var elt_guessboard = document.getElementById("gboard_grower");
    elt_guessboard.innerHTML = "";
    for (var rnum_ixz = 0; rnum_ixz <= currentroundnum - 1; rnum_ixz++) {
        var roundnum9 = rnum_ixz + 1;
        var gword_added = add_a_guess_slot(rnum_ixz);
        if(gword_added == "") {
            return;
        }
    }
    {
        var subbtnid = "subbtn"+(currentroundnum);
        elt_input_for_subbutton = document.getElementById(subbtnid)
        elt_input_for_subbutton.style.display=''
    }
}

// i.e., a Submit button was just clicked, in game mode ...
function get_count_from_current_guess_v_secretword(secretword9, currguess9) {
    "use strict";
    console.log("SECRETWORD: "+secretword9);
    console.log(" CURRGUESS: "+currguess9);
    var bitv_g = string_to_bitvector(currguess9);
    var bitv_s = string_to_bitvector(secretword9);
    var cardx = onset_cardinality(bitv_g & bitv_s) ;
    return cardx;
}

function update_guesses_list_from_html() {
    "use strict";

    var limitroundnum = currentroundnum;
    for(var rndix=1; rndix <= limitroundnum; rndix++) {
        var rnum = rndix.toString();
        var gid = "guess"+rnum;
        var cntid = "count"+rnum;
        var g9 = document.getElementById(gid);
        var c9 = document.getElementById(cntid);
        var gword = g9.value;
        var nmatches;
        if(1 == 0) { // false
        } else if(GAME == game_mode) {
            nmatches = get_count_from_current_guess_v_secretword(secretword, gword);
            console.log("NMATCHES: " + nmatches);
            c9.innerHTML = nmatches;
        } else if(ADVISOR == game_mode) {
            nmatches = c9.value;
        } else {
            console.log("internal error, FAIL")
        }
        if(g9.value == "") {
        } else {
            var gline = [gword, nmatches];
            var rnd_ixz = rndix - 1
            guesslist[rnd_ixz] = gline;
//            currentroundnum = rndix;
        }
    }
}

function add_a_guess_slot(roundnum_ixz) {
    "use strict";
    var roundnum99 = roundnum_ixz + 1 ;
    var rnum = roundnum99.toString();
    var value8=""
    var value9=""
    var gword ;
    var gcount;
    var gameoverflag = 0;
    if(roundnum99 < currentroundnum) {
        var glitem = guesslist[ roundnum_ixz ];
        gword = glitem[0];
        value8 = gword ;
        gcount = glitem[1].toString();
        if((GAME == game_mode) && (gword == secretword)) {
            gcount = 99;
            gameoverflag = 1;
            curline_errmsg = "Game Over! You Win!"
        }
    } else {
        gword = "<wtbd>"
        gcount = ""
        value8 = ""
    }
    var newstuff = "";
    newstuff += "<div class=\"guessentry\" style=\"display:yes;\" >";
    newstuff += "<div class=\"gwroundnum\"> "+rnum+" &nbsp; </div>" ;
    var gwinstuff
    gwinstuff = ""
    value9 = "value=\""+value8+"\""
    gwinstuff += "<input class=\"gwin\" id=\"guess" +rnum+ "\" type=\"text\" maxlength=\"5\" " +value9+ " ; />";
    console.log("GWINSTUFF: " + gwinstuff);
    newstuff += gwinstuff
    // "disabled" makes sense for game mode; in advisor mode, we will omit the "disabled" attribute
    var count_entry=""
    if(GAME == game_mode) {
        count_entry="disabled"
//        count_entry=""
    } 
    newstuff += "<input class=\"gwcnt\" id=\"count"+rnum+"\"  maxlength=\"1\" value=\""+gcount+"\""+count_entry+"/>";
    newstuff += "<button type=\"button\" id=\"subbtn"+rnum+"\" style=\"float:left;display:none;\" onclick=\"myJottoAssistSubmit();\" >Submit</button>"
    newstuff += "</div>";
    if((roundnum99 == currentroundnum)||(gameoverflag == 1)) {
        newstuff += "<div style=\"float:left;\">"
        newstuff += "&nbsp;";
        newstuff += curline_errmsg
        newstuff += "</div>";
    }
    var elt_guessboard = document.getElementById("gboard_grower");
    elt_guessboard.innerHTML += newstuff;
    var elt_guesscount = document.getElementById("count"+rnum)
    elt_guesscount.value = gcount;

    var elt_input_for_focus = document.getElementById("guess"+rnum);
    elt_input_for_focus.focus() ;
    if(gameoverflag == 1) {
        gword = ""
    }
    return gword
}

function format_one_rule(ruletext) {
    "use strict";
    var ruleelts = ruletext.split(":")
    var newruletext = ""
    var sep = ""
    for (var rix = 0; rix < ruleelts.length; rix++) {
        var relt = ruleelts[rix]
        var rcomps = relt.split(",")
        var count = rcomps[0]
        var vector = rcomps[1]
        var rstring = bitvector_to_string(vector)
        var countstr
        if(count == 9) {
            count =  onset_cardinality(vector)
        }
        countstr =  count.toString();
        newruletext += sep
        newruletext += countstr
        newruletext += rstring
        sep = ":"
    }
    return newruletext
}

function add_a_rule_slot(roundnum99, rulekey, rulecount, rule_plausible) {
    "use strict";
    // rulekey is the encoded rule, which we need to break apart and translate into something more readable here
    // rulecount tells us how many times this rule matched a word in the (super-)dictionary
    var rnum = roundnum99.toString();
    var elt_rules = document.getElementById("rules_grower");
    var newstuff = "";
    var ruletext = format_one_rule(rulekey)
    newstuff += "<div class=\"ru_row\">"
    var rule_info_class = "ru_info"
    if(rule_plausible == 0) {
        rule_info_class = "ru_info_implaus"
    }
    newstuff += "<input class=\""+rule_info_class+"\" id=\"rule"+rnum+"\" type=\"text\" maxlength=\"70\" value=\""+ruletext+" ["+rulecount+"]\"\\>";
    newstuff += "</div>";
    elt_rules.innerHTML += newstuff;
}

function add_dictionary_slot_frombitvector(bvword) {
    "use strict";
    word5 = bitvector_to_string1(bvword,"")
    add_a_dictionary_slot(word5)
}

function add_a_dictionary_slot(word) {
    "use strict";
    var vword = word
    if(vword == "") {
        vword = "&nbsp;"
    }
    var disabled_attr = ""
    // if this word is an already-guessed anagram of the secret word, disable it
    if(currentroundnum > 1) {
        if(word_guessed(word, 0)) {
            disabled_attr = "disabled"
        }
    }
    var new_word = "<option value=\""+word+"\" id=\""+word+"\" "+disabled_attr+">"+word
    dictionary_html += new_word;
    dictionary_entries += 1;
}

// i.e. has this word already been guessed before ? (boolean)
function word_guessed(wrd, ntrim) {
    // ntrim is either 0 or 1, to (not trim or) trim the most-recent guess from the comparisons
    hiix = guesslist.length  - ntrim;
    for (var qxz = 0; qxz < hiix; qxz++) {
        var gp = guesslist[qxz] ;
        var gwrd = gp[0];
        if(wrd == gwrd) {
            return 1 ;
        }
    }
    return 0;
}
function is_anagram_of_previous_guess(wrd, ntrim) {
    hiix = guesslist.length  - ntrim;
    var bitvec = string_to_bitvector(wrd) ;
    for (var qxz = 0; qxz < hiix; qxz++) {
        var gp = guesslist[qxz] ;
        var gwrd = gp[0];
        var gwrd_bitvec = string_to_bitvector(gwrd) ;
        var common_count = onset_cardinality(bitvec & gwrd_bitvec) ;
        if(common_count == 5) {
            return gwrd ;
        }
    }
    return "";
}

function clearDictionary() {
    "use strict";
    dictionary_html = "";
    var elt_dict_list = document.getElementById("dl_list");
    while (elt_dict_list.firstChild) {
        elt_dict_list.removeChild(elt_dict_list.firstChild);
    }
    elt_dict_list.innerHTML = "" ;
    elt_dict_list.innerHTML += "<select class=\"dl_sel\" id=\"dict_sel\" onchange=\"saveSelection()\">"
}

function saveSelection() {
    "use strict";
    var myselect = document.getElementById("dict_sel");
    var myselword = myselect.options[myselect.selectedIndex].value;
    var guessx = "guess" + currentroundnum.toString();
    var myg = document.getElementById(guessx);
    var newhtml =  "<input class=\"gwin\" id=\""+guessx+"\" type=\"text\" maxlength=\"5\" value=\""+myselword+"\";/>"
    myg.value = myselword;
    myg.innerHTML = newhtml
}

function populate_dictionary(dictionary_list1) {
    "use strict";
    var elt_dict_list = document.getElementById("dl_list");
    while (elt_dict_list.firstChild) {
        elt_dict_list.removeChild(elt_dict_list.firstChild);
    }
    dictionary_html = "<select class=\"dl_sel\" id=\"dict_sel\" onchange=\"saveSelection()\">"
    add_a_dictionary_slot("") ;
//    console.log("BEGIN building super-dictionary");
    dictionary_entries = 0
//    console.log("END__ building super-dictionary, total entries = ", dictionary_entries);
    var ditem;
    var n_dictionary_items = 0;
    for (ditem in dictionary_list1) {
        var dword1 = dictionary_list1[ditem]
        var dword_vector = string_to_bitvector(dword1)
        var sats_all_guesses = fsats_all_guesses(dword_vector)
        if(sats_all_guesses){
            add_a_dictionary_slot(dword1) ;
            n_dictionary_items += 1;
        }
    }
    dictionary_html += "</select>";
    elt_dict_list.innerHTML +=  dictionary_html ;
    // display the dictionary size 
    var dsize_elt = document.getElementById("dictionary_size99");
    dsize_elt.innerHTML = n_dictionary_items;
}

function onset_cardinality(word) {
    "use strict";
    var card000 = cardinality5_opt[word];
    return card000 ;
}

function onset_cardinality_eq(word000, target_cardinality) {
    "use strict";
    var card1 = onset_cardinality(word000)
    if(card1 == target_cardinality) {
        return 1;
    }
    return 0;
}

function fsats_all_guesses(bitvector) {
    "use strict";
    var ix = 0;
    var sats_all_guesses = 1
    if(debug_mode){
        var bitvector_letters = bitvector_to_string(bitvector)
    }
    if((bitvector & trivially_excluded_letters) == 0) {
        if((minimal_included_letters_test != 0) && ((bitvector & minimal_included_letters_test) == 0)) {
            // this bitvector has none of the letters that might have accounted for a non-zero count, so it can't be a candidate
            sats_all_guesses = 0
            return 0
        } else {
        }
    } else {
        // this bitvector has at least one of the trivially rejected letters, so it can't be a candidate
        sats_all_guesses = 0
        return 0
    }
    if(sats_all_guesses == 1) {
//        for (var ixz = 0; ixz < guesslist.length; ixz++) {
        var hiround = currentroundnum - 1 ;
        if(currentround_errorflag == 1) {
//            hiround -= 1;
        }
        for (var ixz = 0; ixz < hiround; ixz++) {
            if(sats_all_guesses){
                var gp = guesslist[ixz] ;
                var guessword = gp[0] ;
                var card_g = gp[1];
                var gwbitvec = gp[2];
                var common_bitvec = gwbitvec & bitvector ;
                var passes_cardcheck = onset_cardinality_eq(common_bitvec, card_g) ;
                if(passes_cardcheck == 1) {
                    // this super-dictionary word is still a possible source
                } else {
                    sats_all_guesses = 0
                    return 0
                }
            }
        }
    }
    sats_all_guesses = 1
    return 1
}

function log_combo5(aval) {
    "use strict";
    var sats_all_guesses9 = fsats_all_guesses(aval);
    if(sats_all_guesses9 == 1) {
        // this super-dictionary word has satisfied all the guess/response pairs
        // ... so, tabulate the letters in this superdictionary word for the letterboard:
        allons &= aval ;
        alloffs &= ~aval ;
        var avalword_contains_vowel = (((aval & mask_aeiouy) != 0) || (aval == mask_crwth))
        // ... and, figure out a "rule" (based on the alphabet-partition that we have made,
        // based on the list of guess-words)
        var sep=""
        current_rule = ""
        var currrule_possibles_vector = 0
        var consolidated_rule_ons = []
        var consolidated_rule_ons_vec = 0
        var consolidated_rule_offs = []
        var consolidated_rule_offs_vec = 0
        for (var key in partitions_lists) {
            if (partitions_lists.hasOwnProperty(key)) {
                var subsetvector = partitions_vectors[key]
                var sigsubsetmask = aval & subsetvector
                if(debug_mode) {
                    var key_letters = bitvector_to_string(sigsubsetmask)
                }
                var card98 = onset_cardinality(sigsubsetmask)
                var key_contains_vowel = ((subsetvector & mask_aeiouy) != 0)
                if(subsetvector == sigsubsetmask) {
                    // all the letters in this subset are in the rule
                    consolidated_rule_ons_vec |= subsetvector
                } else if(sigsubsetmask == 0) {
                   consolidated_rule_offs_vec |= subsetvector
                } else {
                    current_rule += (sep + card98.toString() + ',' + subsetvector.toString() )
                    currrule_possibles_vector |= subsetvector
                }
            }
            sep =':'
        }
        if(consolidated_rule_ons_vec != 0) {
            var rlen = 9;
            var current_rule_ons = (rlen.toString() + ',' +consolidated_rule_ons_vec.toString())
            current_rule = current_rule_ons + sep + current_rule
            currrule_possibles_vector |= consolidated_rule_ons_vec
            sep = ':'
        }
        if(consolidated_rule_offs_vec != 0) {
            var rlen = 0
            var current_rule_offs = (rlen.toString() + ',' + consolidated_rule_offs_vec.toString())
            current_rule = current_rule + sep + current_rule_offs 
            sep = ':'
        }
        var re87 = /^[:;]+/gi;
        current_rule = current_rule.replace(re87, "");
        var re88 = /[:;]+/gi;
        current_rule = current_rule.replace(re88, ":");
        if(current_rule in rules_dictionary){
            rules_dictionary[current_rule][0] += 1
            plausible = (avalword_contains_vowel || (aval == mask_crwth))
            rules_dictionary[current_rule][1] |= plausible
        } else {
            rules_dictionary[current_rule] = []
            rules_dictionary[current_rule][0] = 1
            // "plausible" flag: the rule has to have at least one vowel (including "y" as a vowel):
            var plausible = 1
            var std_plaus_calc = 0
            if(std_plaus_calc) {
                if((currrule_possibles_vector & mask_aeiouy) == 0) {
                    plausible = 0
                }
                if((currrule_possibles_vector & mask_crwth) == mask_crwth) {
                    // reprieve, special case: the letters of "crwth" are all present in the rule
                    plausible = 1
                }
            } else {
                plausible = avalword_contains_vowel
            }
            rules_dictionary[current_rule][1] = plausible
        }
    }
}

function get_combinations(head, n, r, accept_reject_tabulate) {
    "use strict";
    if((n==0) || (! ((0 <= r) && (r <= n)))) {
        // "unreachable"
        console.log("ValueError");
    }
    if(n == 1) {
        // assert: r==0 or r==1
        var aval = head;
        if(r == 1) {
            aval |= (1 << (n - 1));
        }
        accept_reject_tabulate(aval)
        return;
    }
    if(n > 1) {
        // assert r <= n (and n > 1)
        if(r > 0){
            var newhead1 = (head) | (1 << (n - 1))
            for (var newval88 in get_combinations(newhead1, n-1, r-1, accept_reject_tabulate)){
                accept_reject_tabulate(newval88)
            }
        }
        if(r < n) {
            var newhead0 = head;
            for (var newval99 in get_combinations(newhead0, n-1, r, accept_reject_tabulate)){
                accept_reject_tabulate(newval99)
            }
        }
    }
    return;
}

function string_to_bitvector(instring) {
    "use strict";
    if(instring === undefined) {
        console.trace() ;
    }
    var bitvector = 0;
    var str_array = instring.split("");
    for (var ix=0; ix < instring.length; ix++) {
        var ascii99 = str_array[ix].charCodeAt();
        var alphabetix99 = ascii99 - ('a'.charCodeAt());
        var shift99 = (26-1) - alphabetix99;
        bitvector |= (1 << shift99);
    }
    return bitvector;
}

function bitvector_to_string1(bvec,spacer_string) {
    "use strict";
    var outstring = '';
    var mask = 1 << (26 - 1);
    var qx;
    for (qx = 0; qx < 26; qx++) {
        var ix = qx;
        if((bvec & mask) != 0) {
            outstring += 'abcdefghijklmnopqrstuvwxyz'.substring(ix, ix+1)
        } else {
            outstring += spacer_string
        }
        mask >>= 1;
    }
    return outstring;
}

function bitvector_to_string(bvec) {
    "use strict";
    var outstring = bitvector_to_string1(bvec, '')
    return outstring;
}

function bitvector_to_letterboard_string(bvec) {
    "use strict";
    var outstring = bitvector_to_string1(bvec, " ")
    return outstring;
}

function update_rules() {
    "use strict";
    var elt_rules = document.getElementById("rules_grower");
    elt_rules.innerHTML = "";
    var ruleix = 0
    for (var key in rules_dictionary) {
        if (rules_dictionary.hasOwnProperty(key)) {
            var ruleentry = rules_dictionary[key]
            var rule99count = ruleentry[0]
            var rule_plausible = ruleentry[1]
            add_a_rule_slot(ruleix, key, rule99count, rule_plausible);
        }
        ruleix +=1
    }
}

function update_separations() {
    "use strict";
    var elt_seps98 = document.getElementById('separations98');
    elt_seps98.value = separations_string;
}
function update_letterboard() {
    "use strict";

    var elt_incl = document.getElementById('letters_knownincl');
    var elt_excl = document.getElementById('letters_knownexcl');
    var elt_unks = document.getElementById('letters_unkincl_excl');
    var elt_seen = document.getElementById('seen_letters');
    var elt_unseen = document.getElementById('unseen_letters');

    var rstring_incl = bitvector_to_letterboard_string(allons);
    var rstring_excl = bitvector_to_letterboard_string(alloffs);
    var rstring_unks = bitvector_to_letterboard_string(ALPHA26MASK); /* */
    var rstring_unks = bitvector_to_letterboard_string(ALPHA26MASK & ~(allons | alloffs));
    var rstring_seen = bitvector_to_letterboard_string(seenletters);
    var rstring_notseen = bitvector_to_letterboard_string(~seenletters & ALPHA26MASK);

    elt_incl.value = rstring_incl;
    elt_excl.value = rstring_excl;
    elt_unks.value = rstring_unks;
    elt_seen.value = rstring_seen;
    elt_unseen.value = rstring_notseen;
}

function get_partitions_lists() {
    "use strict";
    var venns = [];
    var alphabstr = 'abcdefghijklmnopqrstuvwxyz';
    var alphabet = alphabstr.split('')
    for (var ix = 0; ix < alphabet.length; ix++) {
        venns[ix] = 0;
    }
    var guess_venn_mask = 1

    if(currentroundnum != guesslist.length) {
        console.log("INTERNAL FAIL blork, currentroundnum vs. guesslist.length ",currentroundnum,guesslist.length);
    }
    
    for (var qxz = 0; qxz < guesslist.length; qxz++) {
        var gp = guesslist[qxz] ;
        var guessword = gp[0] ;
        var gwordary = guessword.split('')
        for (var jx9 = 0; jx9 < gwordary.length; jx9++) {
            var chx = gwordary[jx9];
            var ix00 = (26-1) - (chx.charCodeAt(0) - 'a'.charCodeAt(0));
            venns[ix00] |= guess_venn_mask;
        }
        guess_venn_mask <<= 1
    }
    partitions_lists = {}
    var ix = ('z'.charCodeAt(0) - 'a'.charCodeAt(0))
    for (var ichx = 0; ichx < alphabet.length; ichx++) {
        var chx = alphabet[ichx]
        var vennmask = venns[ix]
        if(vennmask in partitions_lists) {
            partitions_lists[vennmask].push(chx)
        } else {
            partitions_lists[vennmask] = []
            partitions_lists[vennmask].push(chx)
        }
        ix -= 1
    }
    for (var key in partitions_lists) {
        if (partitions_lists.hasOwnProperty(key)) {
            var subset_ary1 = partitions_lists[key]
            var subsetletters = subset_ary1.join("")
            var subsetvector = string_to_bitvector(subsetletters)
            partitions_vectors[key] = subsetvector
        }

    }
    
}

function get_separations() {
    "use strict";
    separations = []
    var unused_letters = ""
    for (var key in partitions_lists) {
        if (partitions_lists.hasOwnProperty(key)) {
            var subset_ary1 = partitions_lists[key]
            var subset_ary2 = subset_ary1.sort()
            var subsetletters = subset_ary2.join("")
            if(key == "0") {
                unused_letters = subsetletters
            } else {
                separations.push(subsetletters)
            }
        }
    }
    separations.sort();
    separations.sort(function(a, b){if( a.length==b.length) {if(a<b) {return -1;}else { if(a>b) {return 1;} else {return 0;}}} else {return a.length-b.length;}});
    var outstring = separations.join(":")
    outstring += ";" + unused_letters
    separations_string = outstring
    var re1 = /^[:;]+/gi;
    separations_string = separations_string.replace(re1, " ");
    var re2 = /[:; ]+/gi;
    separations_string = separations_string.replace(re2, " ");
    separations_string = separations_string.trim();
    return 'feh' // "outstring" (never used)
}
