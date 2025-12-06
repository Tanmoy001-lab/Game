import tkinter as tk
import random
import pygame

#Initialize pygame mixer for music/sounds
pygame.mixer.init()

# Load or set music (replace with your own .mp3 or .wav if you want)
try:
    music_path = "background.mp3"  # put an mp3 file in same folder
    pygame.mixer.music.load(music_path)
    pygame.mixer.music.play(-1)  # loop forever
    pygame.mixer.music.set_volume(0.5)  # Set volume to 50%
    print("🎵 Background music loaded and playing!")
except Exception as e:
    print(f"🎵 Background music file not found ({e}), continuing without music.")

#Sound effects
try:
    merge_sound = pygame.mixer.Sound("merge.wav")  # small pop sound
except:
    merge_sound = None


class Game2048:
    def __init__(self, master):
        self.master = master
        master.title("🎨 2048 Deluxe 🎵")
        master.configure(bg="#222")

        self.grid_size = 4
        self.board = [[0]*self.grid_size for _ in range(self.grid_size)]
        self.score = 0
        self.cells = []

        # Color palette: more vibrant
        self.bg_color = "#1c1c1c"
        self.cell_color = {
            0: "#3c3a32",
            2: "#fcefe6",
            4: "#f2e8cb",
            8: "#f5b682",
            16: "#f29446",
            32: "#ff775c",
            64: "#e64c2e",
            128: "#ede291",
            256: "#fce130",
            512: "#ffda03",
            1024: "#33b5e5",
            2048: "#09c372",
            4096: "#00796b",
        }
        self.text_color = {
            2: "#776e65",
            4: "#776e65",
            8: "#f9f6f2",
            16: "#f9f6f2",
            32: "#f9f6f2",
            64: "#f9f6f2",
            128: "#f9f6f2",
            256: "#f9f6f2",
            512: "#f9f6f2",
            1024: "#f9f6f2",
            2048: "#f9f6f2",
            4096: "#f9f6f2",
        }

        self.create_gui()
        self.start_game()

        # Arrow key bindings
        master.bind("<Up>", self.move_up)
        master.bind("<Down>", self.move_down)
        master.bind("<Left>", self.move_left)
        master.bind("<Right>", self.move_right)

    def create_gui(self):
        # Game title
        title = tk.Label(
            self.master,
            text="🎨 2048 Deluxe Edition 🎵",
            font=("Comic Sans MS", 30, "bold"),
            bg="#222",
            fg="#ffcc00"
        )
        title.pack(pady=10)

        # Score label
        self.score_label = tk.Label(
            self.master,
            text="Score: 0",
            font=("Comic Sans MS", 18, "bold"),
            bg="#222",
            fg="#f1f1f1"
        )
        self.score_label.pack(pady=5)

        # Grid background
        frame = tk.Frame(self.master, bg=self.bg_color)
        frame.pack(padx=10, pady=10)

        for i in range(self.grid_size):
            row = []
            for j in range(self.grid_size):
                cell = tk.Frame(
                    frame,
                    bg=self.cell_color[0],
                    width=130,
                    height=130
                )
                cell.grid(row=i, column=j, padx=6, pady=6)
                label = tk.Label(
                    cell,
                    text="",
                    bg=self.cell_color[0],
                    justify=tk.CENTER,
                    font=("Comic Sans MS", 28, "bold"),
                    width=4,
                    height=2,
                    fg="white"
                )
                label.grid()
                row.append(label)
            self.cells.append(row)

    def start_game(self):
        self.add_new_tile()
        self.add_new_tile()
        self.update_gui()

    def add_new_tile(self):
        empty = [(r, c) for r in range(4) for c in range(4) if self.board[r][c] == 0]
        if not empty:
            return
        r, c = random.choice(empty)
        self.board[r][c] = 2 if random.random() < 0.9 else 4

    def update_gui(self):
        for i in range(4):
            for j in range(4):
                val = self.board[i][j]
                cell = self.cells[i][j]
                color = self.cell_color.get(val, "#3c3a32")
                text_color = self.text_color.get(val, "#f9f6f2")

                cell.config(bg=color)
                cell.config(text=str(val) if val != 0 else "", fg=text_color)
        self.score_label.config(text=f"Score: {self.score}")
        self.master.update_idletasks()

    def compress(self, row):
        new_row = [i for i in row if i != 0]
        new_row += [0]*(4-len(new_row))
        return new_row

    def merge(self, row):
        for i in range(3):
            if row[i] == row[i+1] and row[i] != 0:
                row[i] *= 2
                row[i+1] = 0
                self.score += row[i]
                if merge_sound:
                    merge_sound.play()
        return row

    def move_left_logic(self):
        new_board = []
        for row in self.board:
            row = self.compress(row)
            row = self.merge(row)
            row = self.compress(row)
            new_board.append(row)
        self.board = new_board

    def move_right_logic(self):
        new_board = []
        for row in self.board:
            row = row[::-1]
            row = self.compress(row)
            row = self.merge(row)
            row = self.compress(row)
            new_board.append(row[::-1])
        self.board = new_board

    def transpose(self):
        return [list(r) for r in zip(*self.board)]

    def move_up_logic(self):
        self.board = self.transpose()
        self.move_left_logic()
        self.board = self.transpose()

    def move_down_logic(self):
        self.board = self.transpose()
        self.move_right_logic()
        self.board = self.transpose()

    def move_left(self, event):
        old = [r[:] for r in self.board]
        self.move_left_logic()
        if self.board != old:
            self.add_new_tile()
        self.update_gui()
        self.check_status()

    def move_right(self, event):
        old = [r[:] for r in self.board]
        self.move_right_logic()
        if self.board != old:
            self.add_new_tile()
        self.update_gui()
        self.check_status()

    def move_up(self, event):
        old = [r[:] for r in self.board]
        self.move_up_logic()
        if self.board != old:
            self.add_new_tile()
        self.update_gui()
        self.check_status()

    def move_down(self, event):
        old = [r[:] for r in self.board]
        self.move_down_logic()
        if self.board != old:
            self.add_new_tile()
        self.update_gui()
        self.check_status()

    def check_status(self):
        if any(2048 in row for row in self.board):
            self.show_message("🎉 YOU WIN! 🎉", "#00ff88")
        elif self.game_over():
            self.show_message("💀 GAME OVER 💀", "#ff4444")

    def game_over(self):
        for i in range(4):
            for j in range(4):
                if self.board[i][j] == 0:
                    return False
                if j < 3 and self.board[i][j] == self.board[i][j+1]:
                    return False
                if i < 3 and self.board[i][j] == self.board[i+1][j]:
                    return False
        return True

    def show_message(self, msg, color):
        popup = tk.Toplevel(self.master)
        popup.configure(bg=color)
        popup.title("Game Result")
        label = tk.Label(
            popup, text=msg, bg=color,
            font=("Comic Sans MS", 26, "bold"), fg="white"
        )
        label.pack(padx=30, pady=20)
        tk.Button(popup, text="Play Again", font=("Arial", 14, "bold"),
                  command=lambda: [popup.destroy(), self.reset_game()]).pack(pady=5)
        tk.Button(popup, text="Quit", font=("Arial", 14, "bold"),
                  command=self.master.destroy).pack(pady=5)

    def reset_game(self):
        self.board = [[0]*4 for _ in range(4)]
        self.score = 0
        self.start_game()


if __name__ == "__main__":
    root = tk.Tk()
    root.resizable(False, False)
    Game2048(root)
    root.mainloop()
