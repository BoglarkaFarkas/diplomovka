import os

import cv2
import matplotlib.pyplot as plt
from ultralytics import YOLO

from test_id_example_id import RecognizeTestInfo


class YOLOImageProcessor:
    def __init__(self, model_path, save_dir="final_testing_skusky/everything/88/200/4"):
        self.model = YOLO(model_path)
        self.save_dir = save_dir
        os.makedirs(self.save_dir, exist_ok=True)
        self.trained_with = 664

    def iou(self, box1, box2):
        """
        Calculating the iou
        :param box1: the first box
        :param box2: the second box
        :return: the value of the iou
        """
        x1, y1, x2, y2 = box1
        x1g, y1g, x2g, y2g = box2

        xi1, yi1 = max(x1, x1g), max(y1, y1g)
        xi2, yi2 = min(x2, x2g), min(y2, y2g)

        inter_area = max(0, xi2 - xi1) * max(0, yi2 - yi1)
        box1_area = (x2 - x1) * (y2 - y1)
        box2_area = (x2g - x1g) * (y2g - y1g)

        union_area = box1_area + box2_area - inter_area
        return inter_area / union_area if union_area else 0

    def filter_detections(self, detections):
        """
        Selecting form bounding boxes
        :param detections: the detected bounding boxes
        :return: the filtered bounding boxes
        """
        detections.sort(key=lambda x: x[2], reverse=True)
        filtered = []

        for det in detections:
            x1, y1, x2, y2, cls, conf = det
            keep = True
            fe = det
            for f in filtered:
                fx1, fy1, fx2, fy2, fcls, fconf = f

                if (x1 >= fx1 and y1 >= fy1 and x2 <= fx2 and y2 <= fy2) or self.iou(det[:4], f[:4]) >= 0.6:
                    keep = conf > fconf
                    fe = f
                    if not keep:
                        break

            if keep and fe not in filtered:
                filtered.append(det)
        return filtered

    def get_test_results(self, image_path):
        """
        Processing the image, find the digits -> find the specific numbers (test results) on the paper/image
        :param image_path: the image path
        :return: the id of the test, the example ids (example numbers), the answers from students, and the ID of the student
        """
        image = cv2.imread(image_path)
        test_info = RecognizeTestInfo(image_path)
        id_values, numbers_with_dot_filtered = test_info.extract_test_information()

        example_ids = [num[:-1] if num.endswith('.') else num for num in numbers_with_dot_filtered]

        answers = []
        student_id = None
        height_image, width_image = image.shape[:2]

        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

        blurred = cv2.medianBlur(gray, 1)

        edges = cv2.Canny(blurred, 50, 150)

        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
        edges = cv2.morphologyEx(edges, cv2.MORPH_CLOSE, kernel)

        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        os.makedirs(self.save_dir, exist_ok=True)

        def sort_contours(contours):
            bounding_boxes = [cv2.boundingRect(c) for c in contours]
            return [c for _, c in sorted(zip(bounding_boxes, contours), key=lambda b: (b[0][1], b[0][0]))]

        sorted_contours = sort_contours(contours)
        for i, contour in enumerate(sorted_contours):
            perimeter = cv2.arcLength(contour, True)
            approx = cv2.approxPolyDP(contour, 0.02 * perimeter, True)

            if len(approx) == 4:
                x, y, w, h = cv2.boundingRect(approx)

                if 2475 <= width_image <= 2485:  # DPI: 300
                    x_new = max(x + 10, 0)
                    y_new = max(y + 10, 0)
                    w_new = max(w - 20, 1)
                    h_new = max(h - 20, 1)
                elif 1648 <= width_image <= 1658:  # DPI: 200
                    x_new = max(x + 7, 0)
                    y_new = max(y + 7, 0)
                    w_new = max(w - 14, 1)
                    h_new = max(h - 14, 1)
                elif 3302 <= width_image <= 3312:  # DPI: 400
                    x_new = max(x + 13, 0)
                    y_new = max(y + 13, 0)
                    w_new = max(w - 26, 1)
                    h_new = max(h - 26, 1)
                elif 4955 <= width_image <= 4965:  # DPI: 600
                    x_new = max(x + 20, 0)
                    y_new = max(y + 20, 0)
                    w_new = max(w - 35, 1)
                    h_new = max(h - 35, 1)
                else:
                    x_new, y_new, w_new, h_new = x, y, w, h

                if w > 2 * h and w > 70:
                    cropped_rectangle = image[y_new:y_new + h_new, x_new:x_new + w_new]

                    scale = self.trained_with / w_new

                    height, width = cropped_rectangle.shape[:2]
                    new_width = int(width * scale)
                    new_height = int(height * scale)
                    cropped_rectangle = cv2.resize(cropped_rectangle, (new_width, new_height),
                                                   interpolation=cv2.INTER_CUBIC)

                    gray = cv2.cvtColor(cropped_rectangle, cv2.COLOR_BGR2GRAY)

                    _, dark_mask = cv2.threshold(gray, 100, 255, cv2.THRESH_BINARY_INV)

                    boosted = cv2.addWeighted(cropped_rectangle, 0.2, cropped_rectangle, 0, -50)
                    highlighted = cv2.bitwise_and(boosted, boosted, mask=dark_mask)

                    final = cv2.addWeighted(cropped_rectangle, 0.7, highlighted, 1.0, 0)

                    results = self.model.predict(source=final, conf=0.3, imgsz=max(cropped_rectangle.shape[:2]),
                                                 rect=True)
                    detections = []

                    for result in results:
                        for box in result.boxes:
                            x1, y1, x2, y2 = map(float, box.xyxy[0])
                            cls = int(box.cls[0])
                            conf = float(box.conf[0])
                            detections.append((x1, y1, x2, y2, cls, conf))

                    detections = self.filter_detections(detections)

                    sorted_numbers = [str(cls) for _, _, _, _, cls, _ in sorted(detections, key=lambda d: d[0])]
                    sorted_numbers = ["+" if num == "11" else "-" if num == "10" else num for num in sorted_numbers]
                    recognized_number = "".join(sorted_numbers)
                    print(recognized_number)
                    answers.append(recognized_number)

        if len(answers) >= 2:
            student_id = answers.pop()
        return id_values, example_ids, answers, student_id



