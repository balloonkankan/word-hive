#!/usr/bin/env python3
"""
Wordlist Generator - Clean, comprehensive word lists for word puzzle games
"""

import sys
from pathlib import Path

# NON-CONJUGATING WORDS - These should NEVER have verb/adjective forms generated
NON_CONJUGATING_WORDS = {
    # Prepositions
    'ABOUT', 'ABOVE', 'ACROSS', 'AFTER', 'AGAINST', 'ALONG', 'AMID', 'AMONG',
    'AROUND', 'BEFORE', 'BEHIND', 'BELOW', 'BENEATH', 'BESIDE', 'BESIDES',
    'BETWEEN', 'BEYOND', 'DURING', 'INSIDE', 'ONTO', 'OUTSIDE', 'OVER',
    'PAST', 'SINCE', 'THROUGH', 'THROUGHOUT', 'TOWARD', 'TOWARDS', 'UNDER',
    'UNDERNEATH', 'UNTIL', 'UPON', 'WITHIN', 'WITHOUT',
    
    # Adverbs
    'AGAIN', 'ALMOST', 'ALREADY', 'ALSO', 'ALWAYS', 'AWAY', 'ELSE', 'EVEN',
    'EVER', 'HENCE', 'HOWEVER', 'INDEED', 'INSTEAD', 'JUST', 'MAYBE',
    'MEANWHILE', 'MORE', 'MOREOVER', 'MOST', 'MUCH', 'NEVER', 'NEXT',
    'NONETHELESS', 'OFTEN', 'OTHERWISE', 'PERHAPS', 'QUITE', 'RATHER',
    'REALLY', 'SELDOM', 'SOMEHOW', 'SOMETIMES', 'SOON', 'STILL', 'SUCH',
    'THEN', 'THERE', 'THEREFORE', 'THUS', 'TODAY', 'TOGETHER', 'TOMORROW',
    'TONIGHT', 'VERY', 'WELL', 'WHEN', 'WHERE', 'WHILE', 'YESTERDAY',
    
    # Conjunctions
    'ALTHOUGH', 'BECAUSE', 'UNLESS', 'WHEREAS', 'WHEREVER', 'WHETHER',
    
    # Pronouns
    'ANYBODY', 'ANYONE', 'ANYTHING', 'EVERYBODY', 'EVERYONE', 'EVERYTHING',
    'NOBODY', 'SOMEONE', 'SOMEBODY', 'SOMETHING',
    
    # 2-letter words that don't conjugate normally
    'AM', 'IS', 'BE', 'AN', 'AS', 'AT', 'BY', 'IF', 'IN', 'IT',
    'ME', 'MY', 'NO', 'OF', 'OK', 'ON', 'OR', 'SO', 'TO', 'UP',
    'US', 'WE', 'HE', 'HI',
    
    # Other
    'ENOUGH', 'LESS', 'LEST', 'LIKEWISE', 'OTHER', 'THAN', 'THEIR',
    'THEM', 'THESE', 'THEY', 'THIS', 'THOSE', 'WHAT', 'WHICH', 'WHOSE',
    'WITH', 'YOUR',
}

# Real exceptions - words that match fake patterns but are actually valid
REAL_EXCEPTIONS = {
    'BEING', 'BEER', 'BEES',  # From BE or separate words
    'ONES', 'ORES', 'OWES', 'ODES', 'AXES',  # Real plurals
    'USED', 'USING', 'USER', 'USES',  # From USE
    'DOES', 'DOING', 'DONE',  # From DO
    'GOES', 'GOING', 'GONE',  # From GO
    'TOES', 'TOED',  # From TOE
    'OWED', 'OWER', 'OWING',  # From OWE
    'AFTERNOONS',  # Plural
    'INSIDER', 'INSIDERS', 'OUTSIDER', 'OUTSIDERS',
    'WITHERS', 'OTHERS', 'OVERS', 'UNDERS',
    'LESSER',  # Comparative of LESS
}

# Sanity check - common words that MUST exist
COMMON_WORDS_VALIDATION = [
    'ABLE', 'ABOUT', 'AFTER', 'ALSO', 'BACK', 'BEEN', 'BEST', 'BOTH', 'CALL', 'CAME',
    'COME', 'COULD', 'DOES', 'DONE', 'DOWN', 'EACH', 'EVEN', 'FIND', 'FIRST', 'FROM',
    'GIVE', 'GOOD', 'HAVE', 'HERE', 'INTO', 'JUST', 'KNOW', 'LAST', 'LIKE', 'LONG',
    'LOOK', 'MADE', 'MAKE', 'MANY', 'MORE', 'MOST', 'MUCH', 'MUST', 'NEED', 'NEXT',
    'ONLY', 'OVER', 'PART', 'PEOPLE', 'PLACE', 'SAID', 'SAME', 'SOME', 'SUCH', 'TAKE',
    'THAN', 'THAT', 'THEM', 'THEN', 'THERE', 'THESE', 'THEY', 'THIS', 'TIME', 'VERY',
    'WANT', 'WELL', 'WERE', 'WHAT', 'WHEN', 'WHERE', 'WHICH', 'WILL', 'WITH', 'WORK',
    'WOULD', 'YEAR', 'YOUR',
    # User-reported missing words
    'INSANE', 'CRANE', 'BRAIN', 'PLANE', 'TRAIN', 'SANE',
    # Common forms
    'ADDS', 'RUNS', 'CATS', 'DOGS', 'WALKED', 'RUNNING', 'TRIES',
]


def load_wordlist(filepath):
    """Load words from file"""
    words = set()
    with open(filepath, 'r') as f:
        for line in f:
            word = line.strip().upper()
            if word:
                words.add(word)
    return words


def generate_all_forms(base_word):
    """Generate all valid morphological forms from a base word"""
    if base_word in NON_CONJUGATING_WORDS:
        return set()  # Don't generate forms for non-conjugating words
    
    word_lower = base_word.lower()
    forms = set()
    
    # Plurals / 3rd person
    forms.add(base_word + 'S')
    if word_lower.endswith(('s', 'x', 'z', 'ch', 'sh', 'o')):
        forms.add(base_word + 'ES')
    if len(base_word) >= 2 and word_lower.endswith('y') and word_lower[-2] not in 'aeiou':
        forms.add(base_word[:-1] + 'IES')
    
    # Past tense
    forms.add(base_word + 'ED')
    if word_lower.endswith('e'):
        forms.add(base_word + 'D')
    if len(base_word) >= 2 and word_lower.endswith('y') and word_lower[-2] not in 'aeiou':
        forms.add(base_word[:-1] + 'IED')
    
    # Doubled consonant forms (CVC pattern)
    if (len(base_word) >= 2 and 
        word_lower[-1] not in 'aeiouwxy' and 
        word_lower[-2] in 'aeiou'):
        if len(base_word) == 2 or (len(base_word) == 3 and word_lower[-3] not in 'aeiou'):
            doubled = base_word + base_word[-1]
            forms.add(doubled + 'ED')
            forms.add(doubled + 'ING')
            forms.add(doubled + 'ER')
            forms.add(doubled + 'EST')
    
    # Progressive
    forms.add(base_word + 'ING')
    if word_lower.endswith('e') and len(base_word) >= 2:
        forms.add(base_word[:-1] + 'ING')
    if word_lower.endswith('ie'):
        forms.add(base_word[:-2] + 'YING')
    
    # Comparative/Superlative (for adjectives, typically short words)
    if len(base_word) <= 7:
        forms.add(base_word + 'ER')
        forms.add(base_word + 'EST')
        if word_lower.endswith('e'):
            forms.add(base_word[:-1] + 'ER')
            forms.add(base_word[:-1] + 'EST')
        if len(base_word) >= 2 and word_lower.endswith('y') and word_lower[-2] not in 'aeiou':
            forms.add(base_word[:-1] + 'IER')
            forms.add(base_word[:-1] + 'IEST')
    
    return forms


def generate_fake_words_to_remove():
    """Generate all known fake word patterns to remove"""
    fakes = set()
    
    for base in NON_CONJUGATING_WORDS:
        # All conjugation patterns
        for suffix in ['S', 'ED', 'ING', 'ER', 'EST', 'ES', 'LY',
                       'DED', 'DDED', 'EDED', 'EDDED', 'EDDING', 'DING',
                       'SED', 'SER', 'SES', 'SEST', 'SING']:
            fakes.add(base + suffix)
        
        # Doubled consonant versions
        if base:
            last = base[-1]
            doubled = base + last
            for suffix in ['ED', 'ING', 'ER', 'EST']:
                fakes.add(doubled + suffix)
    
    # Remove real exceptions
    fakes -= REAL_EXCEPTIONS
    
    return fakes


def sanity_check(wordlist):
    """Verify common words are present"""
    missing = []
    for word in COMMON_WORDS_VALIDATION:
        if word not in wordlist:
            missing.append(word)
    
    return missing


def main(input_files, output_file, min_length=4):
    """
    Generate clean wordlist from multiple sources
    
    Args:
        input_files: List of input file paths
        output_file: Output file path
        min_length: Minimum word length (default 4)
    """
    print("Wordlist Generator")
    print("=" * 60)
    
    # Step 1: Load all source word lists
    print(f"\n1. Loading source word lists...")
    all_words = set()
    
    for filepath in input_files:
        words = load_wordlist(filepath)
        print(f"   Loaded {len(words):,} words from {Path(filepath).name}")
        all_words.update(words)
    
    print(f"   Total unique words from sources: {len(all_words):,}")
    
    # Step 2: Filter to minimum length
    print(f"\n2. Filtering to {min_length}+ letter words...")
    all_words = {w for w in all_words if len(w) >= min_length}
    print(f"   Words after length filter: {len(all_words):,}")
    
    # Step 3: Generate all word forms
    print(f"\n3. Generating word forms (plurals, past tense, -ING, etc.)...")
    base_count = len(all_words)
    generated_forms = set()
    
    for word in list(all_words):  # Use list() to avoid modifying set during iteration
        forms = generate_all_forms(word)
        generated_forms.update(forms)
    
    # Add generated forms that are min_length or longer
    generated_forms = {f for f in generated_forms if len(f) >= min_length}
    all_words.update(generated_forms)
    
    print(f"   Generated {len(generated_forms):,} new word forms")
    print(f"   Total words: {len(all_words):,}")
    
    # Step 4: Remove fake words
    print(f"\n4. Removing fake conjugations...")
    fakes_to_remove = generate_fake_words_to_remove()
    fakes_found = all_words & fakes_to_remove
    all_words -= fakes_found
    
    print(f"   Removed {len(fakes_found):,} fake words")
    if fakes_found:
        print(f"   Examples: {', '.join(sorted(fakes_found)[:10])}")
    print(f"   Total words: {len(all_words):,}")
    
    # Step 5: Sanity check
    print(f"\n5. Sanity check - validating common words...")
    missing = sanity_check(all_words)
    
    if missing:
        print(f"   ⚠️  WARNING: {len(missing)} common words missing!")
        print(f"   Missing: {', '.join(missing[:20])}")
        if len(missing) > 20:
            print(f"   ... and {len(missing) - 20} more")
    else:
        print(f"   ✓ All {len(COMMON_WORDS_VALIDATION)} validation words present!")
    
    # Step 6: Save output
    print(f"\n6. Saving word list...")
    with open(output_file, 'w') as f:
        for word in sorted(all_words):
            f.write(word + '\n')
    
    file_size_mb = Path(output_file).stat().st_size / (1024 * 1024)
    print(f"   Saved {len(all_words):,} words to {output_file}")
    print(f"   File size: {file_size_mb:.1f} MB")
    
    # Summary
    print(f"\n" + "=" * 60)
    print(f"SUMMARY:")
    print(f"  Total words: {len(all_words):,}")
    print(f"  Source words: {base_count:,}")
    print(f"  Generated forms: {len(generated_forms):,}")
    print(f"  Fake words removed: {len(fakes_found):,}")
    print(f"  Validation: {len(COMMON_WORDS_VALIDATION) - len(missing)}/{len(COMMON_WORDS_VALIDATION)} common words ✓")
    print("=" * 60)
    
    return len(all_words), len(missing)


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python wordlist_generator.py <input1.txt> [input2.txt...] <output.txt>")
        print("\nExample:")
        print("  python wordlist_generator.py nyt_words.txt words_alpha.txt output/words.txt")
        sys.exit(1)
    
    input_files = sys.argv[1:-1]
    output_file = sys.argv[-1]
    
    main(input_files, output_file, min_length=4)
