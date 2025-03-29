import math

class VectorNorm():

    @staticmethod 
    def vector_norm_euclidean(vector):
        """
        Calculate the the normal form of the vector
        :param vector: the vector
        :return: the result/the value of the normal form
        """
        norm_value = 0
        for i in range(len(vector)):
            norm_value += pow(vector[i], 2)
        norm_value = math.sqrt(norm_value)

        if norm_value - math.floor(norm_value) >= 0.5:
            norm_value = math.ceil(norm_value)
        else:
            norm_value = math.floor(norm_value)

        return norm_value