import re

import cv2
import pytesseract


class RecognizeTestInfo:
    pytesseract.pytesseract.tesseract_cmd = r'/usr/bin/tesseract'

    def __init__(self, image_path):
        self.image_path = image_path

    def extract_test_information(self):
        """
        Extract the Test ID, and the example ids/ example numbers
        :return: the Test ID, and the example ids/ example numbers
        """
        img = cv2.imread(self.image_path)
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        custom_config = r'--oem 3 --psm 6'
        text = pytesseract.image_to_string(gray, config=custom_config)

        words = []
        lines = text.split('\n')
        for line in lines:
            words.extend(line.strip().split())

        id_values = []
        id_keywords = {"ID:", "id:", "Id:"}
        for i in range(len(words) - 1):
            if words[i] in id_keywords:
                if words[i + 1].isdigit():
                    id_values.append(int(words[i + 1]))

        numbers_with_dot_filtered = []
        for i in range(len(words) - 2):
            if re.fullmatch(r'\d+\.', words[i]) and re.fullmatch(r'[A-Za-z].*', words[i + 1]):
                numbers_with_dot_filtered.append(words[i])

        return id_values, numbers_with_dot_filtered
