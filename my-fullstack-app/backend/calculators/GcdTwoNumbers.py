import math

class GcdTwoNumbers():

    @staticmethod 
    def gcd_calculate(number1,number2):
        """
        Calculate the gcd of 2 numbers
        :param number1: the first number
        :param number2: the second number
        :return: the result/the value of the GCD
        """
        gcd_value = math.gcd(number1,number2)
        return gcd_value