import random


class LearningData:
    def __init__(self):
        # Sample data for different learning modes
        self.char_data = [
            {
                "korean": "가",
                "braille": "⠛",
                "description": "ㄱ + ㅏ",
                "tts_text": "가나다라마의 '가'입니다. 점자로는 점 1, 2, 4, 5번을 사용합니다."
            },
            {
                "korean": "나",
                "braille": "⠝",
                "description": "ㄴ + ㅏ",
                "tts_text": "가나다라마의 '나'입니다. 점자로는 점 1, 3, 4, 5번을 사용합니다."
            },
            {
                "korean": "다",
                "braille": "⠙",
                "description": "ㄷ + ㅏ",
                "tts_text": "가나다라마의 '다'입니다. 점자로는 점 1, 4, 5번을 사용합니다."
            },
            {
                "korean": "라",
                "braille": "⠗",
                "description": "ㄹ + ㅏ",
                "tts_text": "가나다라마의 '라'입니다. 점자로는 점 1, 2, 3, 5번을 사용합니다."
            },
            {
                "korean": "마",
                "braille": "⠍",
                "description": "ㅁ + ㅏ",
                "tts_text": "가나다라마의 '마'입니다. 점자로는 점 1, 3, 4번을 사용합니다."
            }
        ]
        
        self.word_data = [
            {
                "korean": "사과",
                "braille": "⠎⠁⠛⠺",
                "description": "사과는 맛있는 과일입니다",
                "tts_text": "사과는 빨간색 과일로 달콤하고 아삭한 맛이 납니다."
            },
            {
                "korean": "책상",
                "braille": "⠉⠑⠱⠁⠝⠛",
                "description": "책을 읽고 글을 쓰는 가구",
                "tts_text": "책상은 책을 읽고 글을 쓸 때 사용하는 가구입니다."
            },
            {
                "korean": "학교",
                "braille": "⠓⠁⠉⠛⠺",
                "description": "공부하는 곳",
                "tts_text": "학교는 학생들이 공부하고 선생님께 배우는 곳입니다."
            },
            {
                "korean": "친구",
                "braille": "⠉⠓⠔⠛⠥",
                "description": "함께 놀고 이야기하는 사람",
                "tts_text": "친구는 서로 좋아하고 함께 놀고 이야기하는 사람입니다."
            },
            {
                "korean": "가족",
                "braille": "⠛⠁⠚⠺",
                "description": "같이 사는 가까운 사람들",
                "tts_text": "가족은 아빠, 엄마, 형제자매 등 함께 사는 가까운 사람들입니다."
            }
        ]
        
        self.sentence_data = [
            {
                "korean": "안녕하세요",
                "braille": "⠁⠝⠝⠽⠓⠁⠎⠑⠽⠺",
                "description": "인사말",
                "tts_text": "안녕하세요는 처음 만나는 사람에게 하는 인사말입니다."
            },
            {
                "korean": "감사합니다",
                "braille": "⠛⠁⠍⠎⠁⠓⠁⠝⠇⠑⠁",
                "description": "고마움을 표현하는 말",
                "tts_text": "감사합니다는 다른 사람의 도움에 고마움을 표현하는 말입니다."
            },
            {
                "korean": "죄송합니다",
                "braille": "⠚⠺⠑⠎⠕⠝⠛⠓⠁⠝⠇⠑⠁",
                "description": "미안함을 표현하는 말",
                "tts_text": "죄송합니다는 실수나 잘못에 대해 미안함을 표현하는 말입니다."
            },
            {
                "korean": "좋은 하루 되세요",
                "braille": "⠚⠕⠓⠑⠝⠓⠁⠗⠥⠙⠺⠑⠎⠑⠽⠺",
                "description": "상대방을 위한 축복의 말",
                "tts_text": "좋은 하루 되세요는 상대방이 좋은 하루를 보내기를 바라는 축복의 말입니다."
            }
        ]
        
        self.free_data = [
            {
                "korean": "오늘 날씨가 좋습니다",
                "braille": "⠕⠝⠇⠝⠁⠇⠎⠊⠛⠁⠚⠕⠎⠎⠑⠍⠝⠑⠁",
                "description": "날씨에 대한 표현",
                "tts_text": "오늘은 맑고 따뜻한 날씨입니다."
            },
            {
                "korean": "점심을 맛있게 먹었습니다",
                "braille": "⠚⠑⠍⠎⠊⠍⠑⠇⠍⠁⠎⠊⠉⠛⠑⠍⠑⠛⠑⠎⠎⠑⠍⠝⠑⠁",
                "description": "식사에 대한 표현",
                "tts_text": "점심을 맛있게 잘 먹었습니다."
            }
        ]
    
    def get_lesson(self, mode):
        """Get lesson data for specified mode"""
        if mode == 'char':
            return self._get_char_lesson()
        elif mode == 'word':
            return self._get_word_lesson()
        elif mode == 'sent':
            return self._get_sentence_lesson()
        elif mode == 'free':
            return self._get_free_lesson()
        else:
            raise ValueError(f"Invalid mode: {mode}")
    
    def _get_char_lesson(self):
        """Get character learning lesson"""
        lesson_item = random.choice(self.char_data)
        return {
            "mode": "char",
            "lesson": lesson_item,
            "test_questions": self._generate_char_test(),
            "instructions": "자음을 학습합니다. TTS를 듣고 점자 패턴을 기억해보세요."
        }
    
    def _get_word_lesson(self):
        """Get word learning lesson"""
        lesson_item = random.choice(self.word_data)
        return {
            "mode": "word",
            "lesson": lesson_item,
            "test_questions": self._generate_word_test(),
            "instructions": "단어를 학습합니다. TTS를 듣고 점자 패턴을 기억해보세요."
        }
    
    def _get_sentence_lesson(self):
        """Get sentence learning lesson"""
        lesson_item = random.choice(self.sentence_data)
        return {
            "mode": "sent",
            "lesson": lesson_item,
            "test_questions": self._generate_sentence_test(),
            "instructions": "문장을 학습합니다. TTS를 듣고 점자 패턴을 기억해보세요."
        }
    
    def _get_free_lesson(self):
        """Get free text lesson"""
        lesson_item = random.choice(self.free_data)
        return {
            "mode": "free",
            "lesson": lesson_item,
            "test_questions": self._generate_free_test(),
            "instructions": "자유 텍스트를 학습합니다. 3글자 단위로 분할하여 점자로 출력됩니다."
        }
    
    def _generate_char_test(self):
        """Generate test questions for character mode"""
        questions = []
        for item in random.sample(self.char_data, 3):
            questions.append({
                "question": f"'{item['korean']}'의 점자는 무엇인가요?",
                "options": [item['braille'], "⠁", "⠃", "⠉"],
                "correct": item['braille']
            })
        return questions
    
    def _generate_word_test(self):
        """Generate test questions for word mode"""
        questions = []
        for item in random.sample(self.word_data, 3):
            questions.append({
                "question": f"'{item['korean']}'의 점자는 무엇인가요?",
                "options": [item['braille'], "⠁⠃⠉", "⠙⠑⠋", "⠛⠓⠊"],
                "correct": item['braille']
            })
        return questions
    
    def _generate_sentence_test(self):
        """Generate test questions for sentence mode"""
        questions = []
        for item in random.sample(self.sentence_data, 2):
            questions.append({
                "question": f"'{item['korean']}'의 점자는 무엇인가요?",
                "options": [item['braille'], "⠁⠃⠉⠙⠑", "⠋⠛⠓⠊⠚", "⠅⠇⠍⠝⠕"],
                "correct": item['braille']
            })
        return questions
    
    def _generate_free_test(self):
        """Generate test questions for free mode"""
        return [
            {
                "question": "자유 텍스트를 점자로 변환하는 방법을 설명해주세요.",
                "options": ["3글자 단위로 분할", "단어별로 분할", "문장별로 분할", "글자별로 분할"],
                "correct": "3글자 단위로 분할"
            }
        ]
