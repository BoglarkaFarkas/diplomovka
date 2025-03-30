class DeterminantMatrix:

    @staticmethod 
    def determinant(matrix):
        """
        Calculate the determinant of the matrix with size 2x2
        :param matrix: the matrix
        :return: the result/the value of the determinant
        """
        return matrix[0][0] * matrix[1][1] - matrix[0][1] * matrix[1][0]

    @staticmethod 
    def determinant_calculate(matrix):
        """
        Calculate the determinant of the matrix
        :param matrix: the matrix
        :return: the result/the value of the determinant
        """
        if len(matrix) == 2:
            return DeterminantMatrix.determinant(matrix)

        det = 0
        for i in range(len(matrix)):
            new_matrix = [row[:i] + row[i + 1:] for row in matrix[1:]]
            if i % 2 == 0:
                det += matrix[0][i] * DeterminantMatrix.determinant_calculate(new_matrix)
            else:
                det -= matrix[0][i] * DeterminantMatrix.determinant_calculate(new_matrix)

        return det
