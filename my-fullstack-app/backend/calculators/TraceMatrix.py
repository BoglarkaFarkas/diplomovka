class TraceMatrix():

    @staticmethod 
    def trace_calculate(matrix):
        """
        Calculate the trace of the matrix
        :param matrix: the matrix
        :return: the result/the value of the trace
        """
        trace = 0
        for i in range(len(matrix)):
            trace += matrix[i][i]
        return trace