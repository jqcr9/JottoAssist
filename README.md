# JottoAssist
John Crown's Jotto Assistant -- computer assist for the 5-letter-word game

Jotto is a word guessing game.  An agent (probably some computer) chooses a
secret word, which consists of 5 distinct letters.  The opponent (human) makes
guesses, where each guess is also a word of 5 distinct letters.  The agent
then responds with the number of letters that match.  (No information is given
about which letters matched, or which position(s) the matching letters were
in.)

The page implemented here can be invoked in three different modes:

AdvisorMode  (http://.../jotto.html?mode=advisor)
GameMode     (http://.../jotto.html?mode=game)   (this is also the default)
TestMode     (http://.../jotto.html?mode=test&secretword=blick)

When this program is used in AdvisorMode, then in each round the user (human)
types-in the word that was guessed, and the number that was reported by the
opponent (and then clicks "Submit".)  Assistance follows in these ways:

The dictionary is pruned, such that the resulting dictionary contains only
words that satisfy each of the guess/response information so far.

A letterboard is updated: each letter of the alphabet will be listed as one of
"proven IN" (the secret word), "proven OUT", or "unknown IN/OUT".  For
additional convenience, the "letters used" (in some guess so far), "letters
unused" are shown, as well as a reference alphabet (mostly for visual
alignment).  The "separations" line shows letters grouped together by usage;
i.e., the letters in any group (the groups being separated by whitespace) in
that line will have appeared in the exact same list of guesses (including the
"letters unused" as one of these groups).

Alternate Rules: a list of rules is provided, where each rule gives a template
which a word may or may not match. Each rule (template) consists of a number
of terms, of the form <number><list of letters>, (e.g. "2chi") meaning that
any word, to satisfy this term, must have exactly 2 of the letters "c", "h",
or "i".  To match the rule, a word must satisfy all of the terms in that rule.
The rules in the AlternateRules list are mutually exclusive, i.e. any Jotto
word (word of 5 distinct letters) can only match at most one rule.  Each of
the words remaining in the dictionary (and presumably, the secret word,
assuming all the guess/response pairs have been reported and entered
accurately) will match exactly one of the AlternateRules.

When invoked in Game Mode, the program chooses a secret word; you enter a
guess and click Submit.  The same assists are provided.  You can easily defeat
the game, because it all runs client-side in javascript.  (E.g., open
developer tools in your browser...)  But what's the point?  We're trying to
help you cheat when you play other people or computers, not to cheat against
yourself.

TestMode exists to help whoever wants to test the page; you choose the
secretword when you invoke the game (which proceeds otherwise as in GameMode);
this allows you to critique the correctness of the helps, as they appear.

