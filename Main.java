
import java.awt.*;
import java.util.prefs.Preferences;
import javax.swing.*;
import javax.swing.event.*;
import javax.swing.text.*;

public class Main extends JFrame {

    private final Preferences prefs =
            Preferences.userNodeForPackage(Main.class);

    private final String[] easy = {
        "Java is easy to learn.",
        "I love coding every day.",
        "Practice makes us better.",
        "Typing improves with time.",
        "Learn something new today.",
        "Small steps bring success."
    };

    private final String[] medium = {
        "Programming develops logical thinking.",
        "Consistency is the key to success.",
        "Every problem has a possible solution.",
        "Learning Java improves problem solving.",
        "Good programmers practise every day.",
        "Technology changes the modern world."
    };

    private final String[] hard = {
        "Efficient algorithms improve application performance.",
        "Object oriented programming encourages reusable code.",
        "Debugging requires patience and logical reasoning.",
        "Developers transform creative ideas into applications.",
        "Accurate typing requires concentration and discipline.",
        "Software engineering combines design and testing."
    };

    private final String[] words = {
        "keyboard", "computer", "programming", "development",
        "variable", "function", "interface", "algorithm",
        "database", "application", "developer", "technology",
        "exception", "inheritance", "polymorphism", "compiler",
        "software", "debugging", "framework", "performance"
    };

    private final Color[][] themes = {
        {
            new Color(17, 24, 39),
            new Color(31, 41, 55),
            Color.WHITE,
            new Color(34, 211, 238)
        },
        {
            new Color(245, 247, 250),
            Color.WHITE,
            new Color(31, 41, 55),
            new Color(37, 99, 235)
        },
        {
            new Color(35, 20, 55),
            new Color(57, 35, 80),
            Color.WHITE,
            new Color(216, 180, 254)
        }
    };

    private int themeIndex = 0;

    private final CardLayout cardLayout = new CardLayout();
    private final JPanel root = new JPanel(cardLayout);

    private JPanel menuPanel;
    private JPanel gamePanel;

    private JLabel modeLabel;
    private JLabel levelLabel;
    private JLabel timerLabel;
    private JLabel scoreLabel;
    private JLabel wpmLabel;
    private JLabel accuracyLabel;
    private JLabel comboLabel;
    private JLabel livesLabel;
    private JLabel instructionLabel;

    private JTextPane targetPane;
    private JTextField typingField;

    private JButton pauseButton;

    private Timer gameTimer;
    private Timer nextTaskTimer;

    private String mode = "LEVEL";
    private String currentText = "";

    private int level = 1;
    private int taskNumber = 0;

    private int score = 0;
    private int combo = 0;
    private int lives = 3;
    private int timeLeft = 35;

    private int elapsedSeconds = 0;
    private int totalTyped = 0;
    private int totalCorrect = 0;

    private int levelStartScore = 0;
    private int levelStartTyped = 0;
    private int levelStartCorrect = 0;
    private int levelStartElapsed = 0;

    private int previousLength = 0;

    private boolean typingStarted = false;
    private boolean sessionStarted = false;
    private boolean taskLocked = false;
    private boolean paused = false;
    private boolean soundEnabled = true;

    public Main() {
        setTitle("Typing Master - Endless Levels");
        setSize(950, 700);
        setMinimumSize(new Dimension(720, 560));
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setLocationRelativeTo(null);

        buildMenu();
        buildGame();

        add(root);
        applyTheme();
        showMenu();
    }

    // ---------------- MENU ----------------

    private void buildMenu() {
        menuPanel = new JPanel();
        menuPanel.setLayout(
                new BoxLayout(menuPanel, BoxLayout.Y_AXIS));

        menuPanel.setBorder(
                BorderFactory.createEmptyBorder(25, 60, 25, 60));

        JLabel title = new JLabel("TYPING MASTER");
        title.setFont(new Font("SansSerif", Font.BOLD, 36));
        title.setAlignmentX(Component.CENTER_ALIGNMENT);

        JLabel subtitle = new JLabel(
                "Improve your speed. Beat your records. Play endlessly.");

        subtitle.setAlignmentX(Component.CENTER_ALIGNMENT);

        menuPanel.add(title);
        menuPanel.add(Box.createVerticalStrut(8));
        menuPanel.add(subtitle);
        menuPanel.add(Box.createVerticalStrut(25));

        addMenuButton("Start Endless Levels", () -> {
            mode = "LEVEL";
            startGame();
        });

        addMenuButton("Practice Mode", () -> {
            mode = "PRACTICE";
            choosePracticeDifficulty();
        });

        addMenuButton("Word Rush - 60 Seconds", () -> {
            mode = "RUSH";
            startGame();
        });

        addMenuButton("Records and Level High Scores",
                this::showRecords);

        addMenuButton("Achievements", this::showAchievements);

        addMenuButton("Change Theme", this::changeTheme);

        addMenuButton("Sound On / Off", () -> {
            soundEnabled = !soundEnabled;
            playSound();

            JOptionPane.showMessageDialog(
                    this,
                    "Sound is " + (soundEnabled ? "ON" : "OFF"));
        });

        addMenuButton("How to Play", this::showInstructions);

        menuPanel.add(Box.createVerticalGlue());

        root.add(menuPanel, "MENU");
    }

    private void addMenuButton(String text, Runnable action) {
        JButton button = new JButton(text);

        button.setFont(new Font("SansSerif", Font.BOLD, 15));
        button.setMaximumSize(new Dimension(380, 42));
        button.setAlignmentX(Component.CENTER_ALIGNMENT);
        button.setFocusPainted(false);

        button.addActionListener(e -> action.run());

        menuPanel.add(button);
        menuPanel.add(Box.createVerticalStrut(8));
    }

    private void choosePracticeDifficulty() {
        String[] options = {"Easy", "Medium", "Hard"};

        String choice = (String) JOptionPane.showInputDialog(
                this,
                "Choose practice difficulty:",
                "Practice Mode",
                JOptionPane.QUESTION_MESSAGE,
                null,
                options,
                options[0]);

        if (choice == null) {
            showMenu();
            return;
        }

        if (choice.equals("Easy")) {
            level = 1;
        } else if (choice.equals("Medium")) {
            level = 3;
        } else {
            level = 5;
        }

        startGame();
    }

    // ---------------- GAME SCREEN ----------------

    private void buildGame() {
        gamePanel = new JPanel(new BorderLayout(12, 12));

        gamePanel.setBorder(
                BorderFactory.createEmptyBorder(18, 22, 18, 22));

        JPanel top = new JPanel(new GridLayout(2, 4, 10, 8));

        modeLabel = new JLabel();
        levelLabel = new JLabel();
        timerLabel = new JLabel();
        scoreLabel = new JLabel();
        wpmLabel = new JLabel();
        accuracyLabel = new JLabel();
        comboLabel = new JLabel();
        livesLabel = new JLabel();

        JLabel[] labels = {
            modeLabel, levelLabel, timerLabel, scoreLabel,
            wpmLabel, accuracyLabel, comboLabel, livesLabel
        };

        for (JLabel label : labels) {
            label.setFont(new Font("SansSerif", Font.BOLD, 14));
            top.add(label);
        }

        gamePanel.add(top, BorderLayout.NORTH);

        JPanel center = new JPanel(new BorderLayout(8, 12));

        JLabel heading = new JLabel("TYPE THE TEXT BELOW");
        heading.setFont(new Font("SansSerif", Font.BOLD, 16));

        targetPane = new JTextPane();
        targetPane.setEditable(false);
        targetPane.setFont(new Font("Monospaced", Font.BOLD, 22));
        targetPane.setMargin(new Insets(25, 20, 25, 20));

        JScrollPane scrollPane = new JScrollPane(targetPane);
        scrollPane.setPreferredSize(new Dimension(600, 180));

        typingField = new JTextField();
        typingField.setFont(new Font("Monospaced", Font.PLAIN, 20));
        typingField.setPreferredSize(new Dimension(100, 48));

        typingField.getDocument().addDocumentListener(
                new DocumentListener() {
                    public void insertUpdate(DocumentEvent e) {
                        typingChanged();
                    }

                    public void removeUpdate(DocumentEvent e) {
                        typingChanged();
                    }

                    public void changedUpdate(DocumentEvent e) {
                        typingChanged();
                    }
                });

        instructionLabel = new JLabel(
                "Start typing to begin the timer.");

        JPanel inputArea = new JPanel(new BorderLayout(5, 8));
        inputArea.add(typingField, BorderLayout.CENTER);
        inputArea.add(instructionLabel, BorderLayout.SOUTH);

        center.add(heading, BorderLayout.NORTH);
        center.add(scrollPane, BorderLayout.CENTER);
        center.add(inputArea, BorderLayout.SOUTH);

        gamePanel.add(center, BorderLayout.CENTER);

        JPanel bottom = new JPanel(
                new FlowLayout(FlowLayout.CENTER, 10, 5));

        JButton restartButton = new JButton("Restart");
        pauseButton = new JButton("Pause");
        JButton menuButton = new JButton("Main Menu");

        restartButton.addActionListener(e -> startGame());
        pauseButton.addActionListener(e -> togglePause());
        menuButton.addActionListener(e -> showMenu());

        bottom.add(restartButton);
        bottom.add(pauseButton);
        bottom.add(menuButton);

        gamePanel.add(bottom, BorderLayout.SOUTH);

        root.add(gamePanel, "GAME");
    }

    // ---------------- START GAME ----------------

    private void startGame() {
        stopTimers();

        if (mode.equals("LEVEL")) {
            level = 1;
        }

        score = 0;
        combo = 0;
        lives = 3;
        taskNumber = 0;

        elapsedSeconds = 0;
        totalTyped = 0;
        totalCorrect = 0;

        levelStartScore = 0;
        levelStartTyped = 0;
        levelStartCorrect = 0;
        levelStartElapsed = 0;

        typingStarted = false;
        sessionStarted = false;
        taskLocked = false;
        paused = false;

        timeLeft = mode.equals("RUSH") ? 60 : getTaskTime();

        pauseButton.setText("Pause");

        cardLayout.show(root, "GAME");

        loadTask();
        updateStats();

        gameTimer = new Timer(1000, e -> timerTick());
        gameTimer.start();

        typingField.requestFocusInWindow();
    }

    // ---------------- LEVEL DIFFICULTY ----------------

    private String[] getSentences() {
        if (level <= 2) {
            return easy;
        }

        if (level <= 4) {
            return medium;
        }

        return hard;
    }

    private int getTaskTime() {
        return Math.max(10, 35 - (level - 1) * 2);
    }

    private String getDifficultyName() {
        if (level <= 2) {
            return "Easy";
        }

        if (level <= 4) {
            return "Medium";
        }

        return "Hard";
    }

    // ---------------- LOAD TASK ----------------

    private void loadTask() {
        taskLocked = false;
        typingStarted = false;
        previousLength = 0;

        typingField.setText("");
        typingField.setEnabled(true);

        if (mode.equals("RUSH")) {
            currentText =
                    words[(int) (Math.random() * words.length)];

            instructionLabel.setText(
                    "Type as many words as possible in 60 seconds.");

        } else {
            String[] source = getSentences();

            currentText = source[
                    (int) (Math.random() * source.length)];

            if (mode.equals("PRACTICE")) {
                instructionLabel.setText(
                        "Practice mode: no countdown or life loss.");
            } else {
                timeLeft = getTaskTime();

                instructionLabel.setText(
                        "Level " + level
                        + " | Task " + (taskNumber + 1)
                        + " of 3 | " + getDifficultyName());
            }
        }

        displayTarget();
        updateStats();
    }

    private void displayTarget() {
        StyledDocument doc = targetPane.getStyledDocument();

        try {
            doc.remove(0, doc.getLength());

            SimpleAttributeSet style = new SimpleAttributeSet();
            StyleConstants.setForeground(
                    style, themes[themeIndex][2]);

            doc.insertString(0, currentText, style);

        } catch (BadLocationException ex) {
            ex.printStackTrace();
        }
    }

    // ---------------- TYPING AND HIGHLIGHTS ----------------

    private void typingChanged() {
        if (currentText.isEmpty() || taskLocked || paused) {
            return;
        }

        String typed = typingField.getText();

        if (!typed.isEmpty()) {
            typingStarted = true;
            sessionStarted = true;
        }

        // Count newly inserted characters, including retyping
        // after backspace.
        if (typed.length() > previousLength) {
            totalTyped += typed.length() - previousLength;
        }

        previousLength = typed.length();

        if (typed.equals(currentText)) {
            submitTask();
            return;
        }

        highlightTypedText(typed);
        updateStats();
    }

    private void highlightTypedText(String typed) {
        StyledDocument doc = targetPane.getStyledDocument();

        Color correct = new Color(74, 222, 128);
        Color wrong = new Color(248, 113, 113);
        Color next = new Color(34, 211, 238);
        Color normal = themes[themeIndex][2];

        for (int i = 0; i < currentText.length(); i++) {
            SimpleAttributeSet style = new SimpleAttributeSet();

            if (i < typed.length()) {
                if (typed.charAt(i) == currentText.charAt(i)) {
                    StyleConstants.setForeground(style, correct);
                } else {
                    StyleConstants.setForeground(style, wrong);
                }
            } else if (i == typed.length()) {
                StyleConstants.setForeground(style, next);
                StyleConstants.setBold(style, true);
            } else {
                StyleConstants.setForeground(style, normal);
            }

            doc.setCharacterAttributes(i, 1, style, true);
        }
    }

    // ---------------- TASK COMPLETION ----------------

    private void submitTask() {
        if (taskLocked) {
            return;
        }

        taskLocked = true;
        typingField.setEnabled(false);

        totalCorrect += currentText.length();

        combo++;
        score += currentText.length() * 10 + combo * 5;

        playSound();
        updateStats();

        if (mode.equals("RUSH")) {
            scheduleNextTask();
            return;
        }

        if (mode.equals("PRACTICE")) {
            scheduleNextTask();
            return;
        }

        taskNumber++;

        if (taskNumber >= 3) {
            taskNumber = 3;

            nextTaskTimer = new Timer(300, e -> {
                nextTaskTimer.stop();
                showLevelResults();
            });

            nextTaskTimer.setRepeats(false);
            nextTaskTimer.start();

        } else {
            scheduleNextTask();
        }
    }

    private void scheduleNextTask() {
        nextTaskTimer = new Timer(300, e -> {
            nextTaskTimer.stop();

            if (paused) {
                return;
            }

            if (mode.equals("PRACTICE")) {
                taskNumber++;

                if (taskNumber >= 3) {
                    taskNumber = 0;
                    level++;
                }
            }

            loadTask();
            typingField.requestFocusInWindow();
        });

        nextTaskTimer.setRepeats(false);
        nextTaskTimer.start();
    }

    // ---------------- ENDLESS LEVEL RESULTS ----------------

    private void showLevelResults() {
        if (gameTimer != null) {
            gameTimer.stop();
        }

        int levelPoints = score - levelStartScore;
        int levelTyped = totalTyped - levelStartTyped;
        int levelCorrect = totalCorrect - levelStartCorrect;
        int levelTime = elapsedSeconds - levelStartElapsed;

        double accuracy = levelTyped == 0
                ? 100.0
                : levelCorrect * 100.0 / levelTyped;

        double minutes = Math.max(
                1.0 / 60.0, levelTime / 60.0);

        int wpm = (int) Math.round(
                (levelCorrect / 5.0) / minutes);

        // Save the best points earned for this particular level.
        String key = "levelBestScore_" + level;
        int oldBest = prefs.getInt(key, 0);

        if (levelPoints > oldBest) {
            prefs.putInt(key, levelPoints);
        }

        // Save the highest level successfully completed.
        int highest = prefs.getInt("highestLevelCompleted", 0);

        if (level > highest) {
            prefs.putInt("highestLevelCompleted", level);
        }

        // Keep the overall high score updated.
        if (score > prefs.getInt("bestScore", 0)) {
            prefs.putInt("bestScore", score);
        }

        if (wpm > prefs.getInt("bestWpm", 0)) {
            prefs.putInt("bestWpm", wpm);
        }

        String results =
                "LEVEL " + level + " COMPLETED!\n\n"
                + "Difficulty: " + getDifficultyName() + "\n"
                + "Points earned this level: " + levelPoints + "\n"
                + "Best score for this level: "
                + prefs.getInt(key, 0) + "\n"
                + "Overall score: " + score + "\n"
                + "WPM: " + wpm + "\n"
                + String.format("Accuracy: %.1f%%\n", accuracy)
                + "Time taken: " + levelTime + " seconds\n"
                + "Tasks completed: 3 / 3";

        String[] options = {"Next Level", "Main Menu"};

        int choice = JOptionPane.showOptionDialog(
                this,
                results,
                "Level " + level + " Results",
                JOptionPane.DEFAULT_OPTION,
                JOptionPane.INFORMATION_MESSAGE,
                null,
                options,
                options[0]);

        if (choice == 0) {
            // Endless progression: there is no maximum level.
            level++;
            taskNumber = 0;

            levelStartScore = score;
            levelStartTyped = totalTyped;
            levelStartCorrect = totalCorrect;
            levelStartElapsed = elapsedSeconds;

            typingStarted = false;
            taskLocked = false;
            paused = false;

            timeLeft = getTaskTime();
            pauseButton.setText("Pause");

            loadTask();

            if (gameTimer != null) {
                gameTimer.start();
            }

            typingField.requestFocusInWindow();

        } else {
            showMenu();
        }
    }

    // ---------------- TIMER ----------------

    private void timerTick() {
        if (paused || !sessionStarted) {
            return;
        }

        elapsedSeconds++;

        if (mode.equals("RUSH")) {
            timeLeft--;

            if (timeLeft <= 0) {
                finishRush();
                return;
            }

        } else if (mode.equals("LEVEL") && typingStarted
                && !taskLocked) {

            timeLeft--;

            if (timeLeft <= 0) {
                loseLife();
                return;
            }
        }

        updateStats();
    }

    private void loseLife() {
        if (taskLocked || paused) {
            return;
        }

        taskLocked = true;
        lives--;
        combo = 0;

        typingField.setEnabled(false);
        playSound();
        updateStats();

        if (lives <= 0) {
            finishGame();
            return;
        }

        nextTaskTimer = new Timer(700, e -> {
            nextTaskTimer.stop();

            taskNumber++;

            if (taskNumber >= 3) {
                taskNumber = 3;
                showLevelResults();
                return;
            }

            loadTask();
            typingField.requestFocusInWindow();
        });

        nextTaskTimer.setRepeats(false);
        nextTaskTimer.start();
    }

    // ---------------- WORD RUSH ----------------

    private void finishRush() {
        stopTimers();

        int rushWpm = calculateWpm();

        String results =
                "WORD RUSH FINISHED!\n\n"
                + "Words and letters score: " + score + "\n"
                + "WPM: " + rushWpm + "\n"
                + "Correct characters: " + totalCorrect + "\n"
                + "Time: 60 seconds";

        JOptionPane.showMessageDialog(
                this,
                results,
                "Word Rush Results",
                JOptionPane.INFORMATION_MESSAGE);

        showMenu();
    }

    // ---------------- STATISTICS ----------------

    private void updateStats() {
        modeLabel.setText("Mode: " + mode);
        levelLabel.setText("Level: " + level);
        scoreLabel.setText("Score: " + score);

        timerLabel.setText(
                mode.equals("PRACTICE")
                        ? "Time: Free"
                        : "Time: " + Math.max(0, timeLeft));

        comboLabel.setText("Combo: " + combo);

        livesLabel.setText(
                mode.equals("LEVEL")
                        ? "Lives: " + lives
                        : "Lives: —");

        double minutes = Math.max(
                1.0 / 60.0, elapsedSeconds / 60.0);

        int wpm = (int) Math.round(
                (totalCorrect / 5.0) / minutes);

        double accuracy = totalTyped == 0
                ? 100.0
                : totalCorrect * 100.0 / totalTyped;

        wpmLabel.setText("WPM: " + wpm);

        accuracyLabel.setText(
                String.format("Accuracy: %.1f%%", accuracy));
    }

    private int calculateWpm() {
        if (elapsedSeconds <= 0) {
            return 0;
        }

        return (int) Math.round(
                (totalCorrect / 5.0)
                / (elapsedSeconds / 60.0));
    }

    // ---------------- PAUSE ----------------

    private void togglePause() {
        if (gameTimer == null) {
            return;
        }

        paused = !paused;

        if (paused) {
            gameTimer.stop();

            if (nextTaskTimer != null) {
                nextTaskTimer.stop();
            }

            pauseButton.setText("Resume");
            typingField.setEnabled(false);
            instructionLabel.setText("Game paused.");

        } else {
            pauseButton.setText("Pause");

            if (!taskLocked) {
                typingField.setEnabled(true);
            }

            if (nextTaskTimer != null && taskLocked) {
                nextTaskTimer.start();
            }

            gameTimer.start();
            instructionLabel.setText("Continue typing.");
            typingField.requestFocusInWindow();
        }
    }

    // ---------------- END GAME ----------------

    private void finishGame() {
        stopTimers();

        typingField.setEnabled(false);

        if (score > prefs.getInt("bestScore", 0)) {
            prefs.putInt("bestScore", score);
        }

        if (calculateWpm() > prefs.getInt("bestWpm", 0)) {
            prefs.putInt("bestWpm", calculateWpm());
        }

        int games = prefs.getInt("games", 0);
        prefs.putInt("games", games + 1);

        String results =
                "GAME OVER\n\n"
                + "Highest level completed: "
                + prefs.getInt("highestLevelCompleted", 0) + "\n"
                + "Level reached: " + level + "\n"
                + "Total score: " + score + "\n"
                + "WPM: " + calculateWpm() + "\n"
                + "Best overall score: "
                + prefs.getInt("bestScore", 0);

        JOptionPane.showMessageDialog(
                this,
                results,
                "Game Over",
                JOptionPane.INFORMATION_MESSAGE);

        showMenu();
    }

    // ---------------- RECORDS ----------------

    private void showRecords() {
        StringBuilder records = new StringBuilder();

        int highest = prefs.getInt("highestLevelCompleted", 0);

        records.append("TYPING MASTER RECORDS\n\n");
        records.append("Highest level completed: ")
                .append(highest).append("\n");

        records.append("Overall high score: ")
                .append(prefs.getInt("bestScore", 0)).append("\n");

        records.append("Best WPM: ")
                .append(prefs.getInt("bestWpm", 0)).append("\n");

        records.append("Games played: ")
                .append(prefs.getInt("games", 0)).append("\n\n");

        records.append("LEVEL-WISE HIGH SCORES\n\n");

        if (highest == 0) {
            records.append("Complete Level 1 to begin your records.");
        } else {
            for (int i = 1; i <= highest; i++) {
                records.append("Level ")
                        .append(i)
                        .append(" - Best Points: ")
                        .append(prefs.getInt("levelBestScore_" + i, 0))
                        .append("\n");
            }
        }

        JTextArea area = new JTextArea(records.toString(), 20, 36);
        area.setEditable(false);
        area.setFont(new Font("Monospaced", Font.PLAIN, 14));
        area.setCaretPosition(0);

        JOptionPane.showMessageDialog(
                this,
                new JScrollPane(area),
                "Records and Level High Scores",
                JOptionPane.INFORMATION_MESSAGE);
    }

    private void showAchievements() {
        String completed =
                prefs.getInt("highestLevelCompleted", 0) >= 6
                        ? "Complete Level 6: UNLOCKED"
                        : "Complete Level 6: LOCKED";

        String speed =
                prefs.getInt("bestWpm", 0) >= 30
                        ? "Reach 30 WPM: UNLOCKED"
                        : "Reach 30 WPM: LOCKED";

        String scoreAchievement =
                prefs.getInt("bestScore", 0) >= 500
                        ? "Score 500 points: UNLOCKED"
                        : "Score 500 points: LOCKED";

        JOptionPane.showMessageDialog(
                this,
                "ACHIEVEMENTS\n\n"
                + completed + "\n"
                + speed + "\n"
                + scoreAchievement,
                "Achievements",
                JOptionPane.INFORMATION_MESSAGE);
    }

    // ---------------- THEME ----------------

    private void changeTheme() {
        themeIndex = (themeIndex + 1) % themes.length;
        applyTheme();
        playSound();
    }

    private void applyTheme() {
        Color background = themes[themeIndex][0];
        Color panelColor = themes[themeIndex][1];
        Color foreground = themes[themeIndex][2];
        Color accent = themes[themeIndex][3];

        menuPanel.setBackground(background);
        gamePanel.setBackground(background);

        applyThemeToChildren(
                menuPanel, background, foreground, accent);

        applyThemeToChildren(
                gamePanel, panelColor, foreground, accent);

        targetPane.setBackground(panelColor);
        targetPane.setForeground(foreground);

        typingField.setBackground(panelColor);
        typingField.setForeground(foreground);
        typingField.setCaretColor(accent);

        displayTarget();
        highlightTypedText(typingField.getText());

        repaint();
    }

    private void applyThemeToChildren(
            Container container,
            Color background,
            Color foreground,
            Color accent) {

        for (Component component : container.getComponents()) {
            component.setBackground(background);

            if (component instanceof JButton) {
                component.setBackground(accent);
                component.setForeground(Color.BLACK);

            } else if (component instanceof JLabel) {
                component.setForeground(foreground);

            } else if (component instanceof JPanel) {
                applyThemeToChildren(
                        (Container) component,
                        background,
                        foreground,
                        accent);
            }
        }
    }

    // ---------------- INSTRUCTIONS ----------------

    private void showInstructions() {
        JOptionPane.showMessageDialog(
                this,
                "HOW TO PLAY\n\n"
                + "1. Select Start Endless Levels.\n"
                + "2. Each level has three typing tasks.\n"
                + "3. Finish all three tasks to see level results.\n"
                + "4. Select Next Level to continue forever.\n"
                + "5. Difficulty increases as you progress.\n"
                + "6. Green letters are correct; red letters are wrong.\n"
                + "7. The task timer starts with your first character.\n"
                + "8. You have three lives in Endless Levels mode.\n"
                + "9. Records saves the best score for each level.\n"
                + "10. Practice and Word Rush are also available.",
                "How to Play",
                JOptionPane.INFORMATION_MESSAGE);
    }

    private void stopTimers() {
        if (gameTimer != null) {
            gameTimer.stop();
        }

        if (nextTaskTimer != null) {
            nextTaskTimer.stop();
        }
    }

    private void showMenu() {
        stopTimers();
        paused = false;
        cardLayout.show(root, "MENU");
    }

    private void playSound() {
        if (soundEnabled) {
            Toolkit.getDefaultToolkit().beep();
        }
    }

    public static void main(String[] args) {
        SwingUtilities.invokeLater(() -> {
            Main game = new Main();
            game.setVisible(true);
        });
    }
}
