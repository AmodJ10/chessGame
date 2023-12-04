import chess
import numpy as np

board = chess.Board()

from flask import Flask, request, jsonify

app = Flask(__name__)

def getMobility(color):
    attacked = chess.SquareSet()
    for attacker in chess.SquareSet(board.occupied_co[color]):
        attacked |= board.attacks(attacker)
    return len(attacked)

piece_square_table = {
    'P' : np.array([ [0,  0,  0,  0,  0,  0,  0,  0],
            [50, 50, 50, 50, 50, 50, 50, 50],
            [10, 10, 20, 30, 30, 20, 10, 10],
            [5,  5, 10, 25, 25, 10,  5,  5],
            [0,  0,  0, 20, 20,  0,  0,  0],
            [5, -5,-10,  0,  0,-10, -5,  5],
            [5, 10, 10,-20,-20, 10, 10,  5],
            [0,  0,  0,  0,  0,  0,  0,  0]]),
    'N' : np.array([[-50,-40,-30,-30,-30,-30,-40,-50],
            [-40,-20,  0,  0,  0,  0,-20,-40],
            [-30,  0, 10, 15, 15, 10,  0,-30],
            [-30,  5, 15, 20, 20, 15,  5,-30],
            [-30,  0, 15, 20, 20, 15,  0,-30],
            [-30,  5, 10, 15, 15, 10,  5,-30],
            [-40,-20,  0,  5,  5,  0,-20,-40],
            [-50,-40,-30,-30,-30,-30,-40,-50]]),
    'B' : np.array([[-20,-10,-10,-10,-10,-10,-10,-20],
            [-10,  0,  0,  0,  0,  0,  0,-10],
            [-10,  0,  5, 10, 10,  5,  0,-10],
            [-10,  5,  5, 10, 10,  5,  5,-10],
            [-10,  0, 10, 10, 10, 10,  0,-10],
            [-10, 10, 10, 10, 10, 10, 10,-10],
            [-10,  5,  0,  0,  0,  0,  5,-10],
            [-20,-10,-10,-10,-10,-10,-10,-20]]),
    'R' : np.array([[0,  0,  0,  0,  0,  0,  0,  0],
            [5, 10, 10, 10, 10, 10, 10,  5],
            [-5,  0,  0,  0,  0,  0,  0, -5],
            [-5,  0,  0,  0,  0,  0,  0, -5],
            [-5,  0,  0,  0,  0,  0,  0, -5],
            [-5,  0,  0,  0,  0,  0,  0, -5],
            [-5,  0,  0,  0,  0,  0,  0, -5],
            [0,  0,  0,  5,  5,  0,  0,  0]]),
    'Q' : np.array([[-20,-10,-10, -5, -5,-10,-10,-20],
            [-10,  0,  0,  0,  0,  0,  0,-10],
            [-10,  0,  5,  5,  5,  5,  0,-10],
            [-5,  0,  5,  5,  5,  5,  0, -5],
            [0,  0,  5,  5,  5,  5,  0, -5],
            [-10,  5,  5,  5,  5,  5,  0,-10],
            [-10,  0,  5,  0,  0,  0,  0,-10],
            [-20,-10,-10, -5, -5,-10,-10,-20]])

}


piece_to_num = {
    'P' : 0,
    'N' : 1,
    'B' : 2,
    'R' : 3,
    'Q' : 4,
    'K' : 5,

    'p' : 6,
    'n' : 7,
    'b' : 8,
    'r' : 9,
    'q' : 10,
    'k' : 11,
}

def convert_to_array(fen):
    board = np.zeros((12,8,8))
    fen_split = fen.split()
    fen_string = fen_split[0]

    rows =  fen_string.split('/')

    for i in range(8):
        pos=0
        for j in range(len(rows[i])):
            if rows[i][j].isnumeric():
                pos+=int(rows[i][j])
            else:
                board[piece_to_num[rows[i][j]],i,pos] = 1
                # print(i,pos,piece_to_num[rows[i][j]])
                pos+=1
    return board

def get_pst_eval(board):
    eval = 0
    eval += np.multiply(board[0] ,piece_square_table['P']).sum()
    eval += np.multiply(board[1] ,piece_square_table['N']).sum()
    eval += np.multiply(board[2] , piece_square_table['B']).sum()
    eval += np.multiply(board[3] , piece_square_table['R']).sum()
    eval += np.multiply(board[4] ,piece_square_table['Q']).sum()

    eval -= np.multiply(board[6] ,np.flip(piece_square_table['P'],0)).sum()
    eval -= np.multiply(board[7] ,np.flip(piece_square_table['N'],0)).sum()
    eval -= np.multiply(board[8] ,np.flip(piece_square_table['B'],0)).sum()
    eval -= np.multiply(board[9] ,np.flip(piece_square_table['R'],0)).sum()
    eval -= np.multiply(board[10] ,np.flip(piece_square_table['Q'],0)).sum()

    return eval


def Eval():
    eval = 0
    fen = board.fen()
    fen = (fen.split())[0]
    eval += 900*(fen.count('Q')-fen.count('q'))
    eval += 500*(fen.count('R')-fen.count('r'))
    eval += 350*(fen.count('B')-fen.count('b'))
    eval += 300*(fen.count('N')-fen.count('n'))
    eval += 100*(fen.count('P')-fen.count('p'))
    eval += getMobility(1) - getMobility(0)
    eval += get_pst_eval(convert_to_array(fen))
    return eval

def maxi(depth,alpha,beta):
    if depth == 0:
        return Eval(),None
    # max_eval = -float('INF')
    legal_moves = board.legal_moves
    best_move = None
    for i in legal_moves:
        board.push(i)
        score,move = mini(depth-1,alpha,beta)
        board.pop()
        if  score >= beta :
            # print("Mini - ",depth,max_eval,score,i)
            # best_move = i
            return beta,best_move
        elif score > alpha :
            best_move = i
            alpha = score
    # print("Maxi - ",depth,max_eval,best_move)
    return alpha,best_move


def mini(depth,alpha,beta):
    if depth == 0:
        return Eval(),None
    # max_eval = -float('INF')
    legal_moves = board.legal_moves
    best_move = None
    for i in legal_moves:
        board.push(i)
        score,move = maxi(depth-1,alpha,beta)
        board.pop()
        if  score <= alpha :
            # print("Mini - ",depth,max_eval,score,i)
            # best_move = i
            return alpha,best_move
        elif score < beta :
            best_move = i
            beta = score
    # print("Maxi - ",depth,max_eval,best_move)
    return beta,best_move



# Sample function that processes the parameters
def best_move(fen, turn, depth):
    board = chess.Board(fen)
    if turn == 1:
        score,move = maxi(depth,-float('inf'),float('inf'))
    else:
        score,move = mini(depth,-float('inf'),float('inf'))
    return {
        "best_move": move.uci(),
    }

@app.route('/get_best_move', methods=['GET'])
def get_request():
    fen = request.args.get('fen')
    turn = request.args.get('turn')
    depth = request.args.get('depth')

    if not all([fen, turn, depth]):
        return jsonify({"error": "Missing parameters"}), 400
    result = best_move(fen, int(turn), int(depth))
    return jsonify(result)

if __name__ == '__main__':
    app.run(debug=True)
