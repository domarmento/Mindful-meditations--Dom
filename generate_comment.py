import sys
import nltk
from nltk.sentiment import SentimentIntensityAnalyzer
from nltk.tokenize import word_tokenize
from nltk.corpus import stopwords
from collections import Counter

nltk.download('punkt', quiet=True)
nltk.download('stopwords', quiet=True)
nltk.download('vader_lexicon', quiet=True)

def generate_comment(text):
    # Sentiment analysis
    sia = SentimentIntensityAnalyzer()
    sentiment = sia.polarity_scores(text)

    # Keyword extraction
    stop_words = set(stopwords.words('english'))
    words = word_tokenize(text.lower())
    keywords = [word for word in words if word.isalnum() and word not in stop_words]
    top_keywords = Counter(keywords).most_common(3)

    # Generate comment
    if sentiment['compound'] > 0.05:
        mood = "positive"
    elif sentiment['compound'] < -0.05:
        mood = "negative"
    else:
        mood = "neutral"

    comment = f"Your entry seems to have a {mood} tone. "
    comment += f"Key themes I noticed: {', '.join(word for word, _ in top_keywords)}. "
    comment += "Remember, journaling is a journey of self-discovery. Keep exploring your thoughts and feelings!"

    return comment

if __name__ == "__main__":
    input_text = sys.argv[1]
    result = generate_comment(input_text)
    print(result)
