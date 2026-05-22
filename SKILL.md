---
name: wordlist-generator
description: Generate comprehensive, clean English word lists for word puzzle games. Combines multiple sources (NYT word lists, English dictionaries), generates all valid word forms (plurals, past tenses, progressives, comparatives), and systematically filters out fake/invalid words. Use when creating or cleaning word lists for games like Spelling Bee, Wordle, crosswords, or any word puzzle requiring 4+ letter English words.
---

# Wordlist Generator Skill

Generate high-quality, comprehensive English word lists for word puzzle games by:
1. Combining authoritative sources (NYT curated lists, standard dictionaries)
2. Systematically generating all valid word forms (plurals, verb conjugations, etc.)
3. Rigorously filtering fake/invalid words
4. Validating against common English words

## When to Use This Skill

Use this skill when:
- Building a word list for a word puzzle game
- Expanding an existing word list with missing forms
- Cleaning a word list that has fake/invalid words
- Verifying word list quality and completeness
- User mentions: "word list", "dictionary", "valid words", "missing words", "fake words"

## Core Workflow

### Step 1: Gather Source Word Lists

Combine authoritative sources:

```python
# 1. NYT Curated List (if available)
# - High quality, game-tested words
# - Usually ~7K-10K words from scraped puzzles

# 2. User's Existing List (if provided)
# - May have good coverage but fake words
# - Needs cleaning

# 3. Standard English Dictionary (if downloadable)
# - Comprehensive coverage
# - e.g., SCOWL, words_alpha.txt (~370K words)
```

**Merge Strategy:**
- Start with union of all sources
- De-duplicate
- Filter to minimum word length (typically 4+ letters)

### Step 2: Generate All Valid Word Forms

Systematically generate forms from base words using English morphology rules:

#### Plurals
```python
def generate_plurals(word):
    word_lower = word.lower()
    forms = set()
    
    # Rule 1: Simple -S (most words)
    # CAT → CATS, DOG → DOGS
    forms.add(word.upper() + 'S')
    
    # Rule 2: -ES for sibilants (S, X, Z, CH, SH) and O
    # BOX → BOXES, BUZZ → BUZZES, HERO → HEROES
    if word_lower.endswith(('s', 'x', 'z', 'ch', 'sh', 'o')):
        forms.add(word.upper() + 'ES')
    
    # Rule 3: Consonant + Y → -IES
    # BABY → BABIES, CRY → CRIES
    if len(word) >= 2 and word_lower.endswith('y'):
        if word_lower[-2] not in 'aeiou':
            forms.add(word.upper()[:-1] + 'IES')
    
    return forms
```

#### Past Tense
```python
def generate_past_tense(word):
    word_lower = word.lower()
    forms = set()
    
    # Rule 1: Simple -ED
    # WALK → WALKED, TALK → TALKED
    forms.add(word.upper() + 'ED')
    
    # Rule 2: Words ending in E → just add D
    # LOVE → LOVED, BAKE → BAKED
    if word_lower.endswith('e'):
        forms.add(word.upper() + 'D')
    
    # Rule 3: Consonant + Y → -IED
    # CRY → CRIED, TRY → TRIED
    if len(word) >= 2 and word_lower.endswith('y'):
        if word_lower[-2] not in 'aeiou':
            forms.add(word.upper()[:-1] + 'IED')
    
    # Rule 4: CVC pattern → double consonant + ED
    # PAT → PATTED, STOP → STOPPED, RUN → RUNNED
    # (Note: irregular verbs will be filtered later)
    if (len(word) >= 2 and 
        word_lower[-1] not in 'aeiouwxy' and 
        word_lower[-2] in 'aeiou'):
        # Only for short words (2-3 letters) or CVC pattern
        if len(word) == 2 or (len(word) == 3 and word_lower[-3] not in 'aeiou'):
            doubled = word.upper() + word.upper()[-1]
            forms.add(doubled + 'ED')
    
    return forms
```

#### Progressive (-ING)
```python
def generate_progressive(word):
    word_lower = word.lower()
    forms = set()
    
    # Rule 1: Simple -ING
    # WALK → WALKING, RUN → RUNNING
    forms.add(word.upper() + 'ING')
    
    # Rule 2: Drop E + ING
    # MAKE → MAKING, BAKE → BAKING
    if word_lower.endswith('e') and len(word) >= 2:
        forms.add(word.upper()[:-1] + 'ING')
    
    # Rule 3: IE → YING
    # DIE → DYING, LIE → LYING
    if word_lower.endswith('ie'):
        forms.add(word.upper()[:-2] + 'YING')
    
    # Rule 4: CVC pattern → double consonant + ING
    # RUN → RUNNING, SIT → SITTING
    if (len(word) >= 2 and 
        word_lower[-1] not in 'aeiouwxy' and 
        word_lower[-2] in 'aeiou'):
        if len(word) == 2 or (len(word) == 3 and word_lower[-3] not in 'aeiou'):
            doubled = word.upper() + word.upper()[-1]
            forms.add(doubled + 'ING')
    
    return forms
```

#### Comparatives/Superlatives
```python
def generate_comparatives(word):
    word_lower = word.lower()
    forms = set()
    
    # Only for short adjectives (typically ≤7 letters)
    if len(word) > 7:
        return forms
    
    # Rule 1: Simple -ER, -EST
    # FAST → FASTER, FASTEST
    forms.add(word.upper() + 'ER')
    forms.add(word.upper() + 'EST')
    
    # Rule 2: Drop E + ER/EST
    # LARGE → LARGER, LARGEST
    if word_lower.endswith('e'):
        forms.add(word.upper()[:-1] + 'ER')
        forms.add(word.upper()[:-1] + 'EST')
    
    # Rule 3: Consonant + Y → -IER/-IEST
    # HAPPY → HAPPIER, HAPPIEST
    if len(word) >= 2 and word_lower.endswith('y'):
        if word_lower[-2] not in 'aeiou':
            forms.add(word.upper()[:-1] + 'IER')
            forms.add(word.upper()[:-1] + 'IEST')
    
    # Rule 4: CVC pattern → double + ER/EST
    # BIG → BIGGER, BIGGEST
    if (len(word) >= 2 and 
        word_lower[-1] not in 'aeiouwxy' and 
        word_lower[-2] in 'aeiou'):
        if len(word) == 2 or (len(word) == 3 and word_lower[-3] not in 'aeiou'):
            doubled = word.upper() + word.upper()[-1]
            forms.add(doubled + 'ER')
            forms.add(doubled + 'EST')
    
    return forms
```

### Step 3: CRITICAL - Filter Fake Words

This is the most important step. Many word lists have fake words from over-aggressive generation.

#### Category 1: Non-Conjugating Words

**NEVER generate verb/adjective forms from:**

```python
NON_CONJUGATING_WORDS = {
    # Prepositions (don't conjugate)
    'ABOUT', 'ABOVE', 'ACROSS', 'AFTER', 'AGAINST', 'ALONG', 'AMID', 'AMONG',
    'AROUND', 'BEFORE', 'BEHIND', 'BELOW', 'BENEATH', 'BESIDE', 'BESIDES',
    'BETWEEN', 'BEYOND', 'DURING', 'INSIDE', 'ONTO', 'OUTSIDE', 'OVER',
    'PAST', 'SINCE', 'THROUGH', 'THROUGHOUT', 'TOWARD', 'TOWARDS', 'UNDER',
    'UNDERNEATH', 'UNTIL', 'UPON', 'WITHIN', 'WITHOUT',
    
    # Adverbs (don't conjugate)
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
    
    # Auxiliary/Modal verbs (irregular, don't follow normal patterns)
    'AM', 'IS', 'BE', 'BEEN', 'BEING',  # Forms of BE are real, but don't generate BEED
    
    # Articles, determiners, particles
    'AN', 'AS', 'AT', 'BY', 'IF', 'IN', 'IT', 'ME', 'MY', 'NO', 'OF',
    'OK', 'ON', 'OR', 'SO', 'TO', 'UP', 'US', 'WE', 'HE', 'HI',
    
    # Other non-conjugating
    'ENOUGH', 'LESS', 'LEST', 'LIKEWISE', 'OTHER', 'THAN', 'THEIR',
    'THEM', 'THESE', 'THEY', 'THIS', 'THOSE', 'WHAT', 'WHICH', 'WHOSE',
    'WITH', 'YOUR',
}

# Generate all fake forms to remove
for base in NON_CONJUGATING_WORDS:
    remove_words.add(base + 'S')
    remove_words.add(base + 'ED')
    remove_words.add(base + 'ING')
    remove_words.add(base + 'ER')
    remove_words.add(base + 'EST')
    # ... etc
```

**Examples of fakes to remove:**
- ABOUTED, ABOUTING, ABOUTER (from ABOUT)
- ABOVED, ABOVEING (from ABOVE)
- ACROSSED, ACROSSING (from ACROSS)
- AMED, AMING (from AM)
- ISED, ISING (from IS)

#### Category 2: Real Exceptions

Some words LOOK like they match fake patterns but are actually real:

```python
REAL_EXCEPTIONS = {
    # These happen to match patterns but are real words
    'BEING',  # Real word (not BEED though!)
    'BEER', 'BEES',  # Separate words, not from BE
    'ONES', 'ORES', 'OWES', 'ODES', 'AXES',  # Real plurals
    'USED', 'USING', 'USER', 'USES',  # From USE (real verb)
    'DOES', 'DOING', 'DONE',  # From DO (real verb)
    'GOES', 'GOING', 'GONE',  # From GO (real verb)
    'TOES', 'TOED',  # From TOE (real noun/verb)
    'OWED', 'OWER', 'OWES', 'OWING',  # From OWE (real verb)
    'AFTERNOONS',  # Plural of AFTERNOON
    'INSIDER', 'INSIDERS', 'OUTSIDER', 'OUTSIDERS',  # Real words
    'WITHERS', 'OTHERS', 'OVERS', 'UNDERS',  # Real words
    'LESSER',  # Real comparative of LESS
}
```

### Step 4: Sanity Check - Common Words Validation

ALWAYS verify the final list contains the most common English words:

```python
COMMON_WORDS_MUST_EXIST = [
    # Top 100 most common 4+ letter words
    'ABLE', 'ABOUT', 'AFTER', 'ALSO', 'BACK', 'BEEN', 'BEST', 'BOTH',
    'CALL', 'CAME', 'COME', 'COULD', 'DOES', 'DONE', 'DOWN', 'EACH',
    'EVEN', 'FIND', 'FIRST', 'FROM', 'GIVE', 'GOOD', 'HAVE', 'HERE',
    'INTO', 'JUST', 'KNOW', 'LAST', 'LIKE', 'LONG', 'LOOK', 'MADE',
    'MAKE', 'MANY', 'MORE', 'MOST', 'MUCH', 'MUST', 'NEED', 'NEXT',
    'ONLY', 'OVER', 'PART', 'PEOPLE', 'PLACE', 'SAID', 'SAME', 'SOME',
    'SUCH', 'TAKE', 'THAN', 'THAT', 'THEM', 'THEN', 'THERE', 'THESE',
    'THEY', 'THIS', 'TIME', 'VERY', 'WANT', 'WELL', 'WERE', 'WHAT',
    'WHEN', 'WHERE', 'WHICH', 'WILL', 'WITH', 'WORK', 'WOULD', 'YEAR',
    'YOUR',
    
    # Commonly missed words (user reported)
    'INSANE', 'CRANE', 'BRAIN', 'PLANE', 'TRAIN', 'SANE',
    
    # Common word forms that should exist
    'ADDS', 'RUNS', 'CATS', 'DOGS', 'WALKED', 'RUNNING', 'TRIES',
    'BIGGER', 'FASTEST', 'HAPPIER',
]

# Verify all exist
missing = [w for w in COMMON_WORDS_MUST_EXIST if w not in final_wordlist]
if missing:
    print(f"⚠️ WARNING: {len(missing)} common words missing!")
    print(missing[:20])  # Show first 20
```

### Step 5: Output Format

Provide the user with:

1. **Final word list file** (words.txt)
   - One word per line
   - All uppercase
   - Sorted alphabetically
   - 4+ letters only (or user-specified minimum)

2. **Summary statistics**
   ```
   Total words: 582,000
   Source breakdown:
     - NYT curated: 7,695
     - Dictionary: 370,000
     - Generated forms: 204,305
   
   Fake words removed: 1,508
   Common words validation: 653/653 ✓
   ```

3. **Verification report**
   - Sanity check results
   - Examples of included words
   - Examples of removed fake words

## Common Issues and Solutions

### Issue 1: "Word X is missing!"

**Solution:** Check if:
1. Word is in source lists? → Add to sources
2. Word is a form of another word? → Check generation rules
3. Word was incorrectly filtered? → Add to REAL_EXCEPTIONS

### Issue 2: "Word Y is fake!"

**Solution:** Check if:
1. Base word is in NON_CONJUGATING_WORDS? → Add it
2. It's a weird conjugation pattern? → Add specific removal rule
3. It's from 2-letter base? → Check if base should conjugate

### Issue 3: "Too many/too few words"

**Solution:**
- Too many: User may have over-generated. Review fake word filters.
- Too few: May be missing source lists. Try adding SCOWL dictionary.

## Quality Checklist

Before delivering final word list:

- [ ] No fake conjugations (ABOUTED, ABOVED, etc.)
- [ ] No fake 2-letter forms (AMED, ISED, etc.)
- [ ] All common words present (653+ validation)
- [ ] Minimum word length enforced (typically 4+)
- [ ] All forms generated (plurals, past tense, -ING, comparatives)
- [ ] Source attribution documented
- [ ] File size reasonable (~6-7MB for 580K words)

## Example Usage

**User:** "Create a word list for my Spelling Bee game. I have an NYT list and need all word forms, no fakes, 4+ letters only."

**Claude:** 
1. Loads NYT list
2. Generates all forms systematically
3. Filters fake words rigorously
4. Validates common words
5. Outputs clean list with statistics

**Result:** 580K+ clean words, validated and ready for production.
