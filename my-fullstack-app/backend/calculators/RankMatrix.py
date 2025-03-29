import numpy as np

class RankMatrix:

    @staticmethod 
    def matrix_rank_calculate(matrix):
        """
        Calculate the rank of the matrix
        :param matrix: the matrix
        :return: the result/the value of the rank
        """
        new_matrix = np.array(matrix)
        rank_of_matrix = np.linalg.matrix_rank(new_matrix)
        return int(rank_of_matrix)
   