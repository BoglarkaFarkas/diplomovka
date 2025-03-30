import numpy as np

class CorankMatrix():

    @staticmethod 
    def matrix_corank_calculate(matrix):
        """
        Calculate the corank of the matrix
        :param matrix: the matrix
        :return: the result/the value of the corank
        """
        new_matrix = np.array(matrix)
        rank_of_matrix = np.linalg.matrix_rank(new_matrix)
        colum = new_matrix.shape[1]
        crank_of_matrix = colum - rank_of_matrix
        return int(crank_of_matrix)