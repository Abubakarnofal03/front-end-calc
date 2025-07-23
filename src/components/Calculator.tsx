import { useState } from 'react';

export function Calculator() {
  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operation, setOperation] = useState<string | null>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);

  const inputNumber = (num: string) => {
    if (waitingForOperand) {
      setDisplay(num);
      setWaitingForOperand(false);
    } else {
      setDisplay(display === '0' ? num : display + num);
    }
  };

  const inputDecimal = () => {
    if (waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
    } else if (display.indexOf('.') === -1) {
      setDisplay(display + '.');
    }
  };

  const clear = () => {
    setDisplay('0');
    setPreviousValue(null);
    setOperation(null);
    setWaitingForOperand(false);
  };

  const clearEntry = () => {
    setDisplay('0');
  };

  const backspace = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
    }
  };

  const performOperation = (nextOperation: string) => {
    const inputValue = parseFloat(display);

    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operation) {
      const currentValue = previousValue || 0;
      const newValue = calculate(currentValue, inputValue, operation);

      setDisplay(String(newValue));
      setPreviousValue(newValue);
    }

    setWaitingForOperand(true);
    setOperation(nextOperation);
  };

  const calculate = (firstValue: number, secondValue: number, operation: string) => {
    switch (operation) {
      case '+':
        return firstValue + secondValue;
      case '-':
        return firstValue - secondValue;
      case '×':
        return firstValue * secondValue;
      case '÷':
        return firstValue / secondValue;
      case '=':
        return secondValue;
      default:
        return secondValue;
    }
  };

  const handleEquals = () => {
    const inputValue = parseFloat(display);

    if (previousValue !== null && operation) {
      const newValue = calculate(previousValue, inputValue, operation);
      setDisplay(String(newValue));
      setPreviousValue(null);
      setOperation(null);
      setWaitingForOperand(true);
    }
  };

  const Button = ({ onClick, className, children, ...props }: any) => (
    <button
      onClick={onClick}
      className={`h-16 rounded-xl font-semibold text-lg transition-all duration-200 active:scale-95 ${className}`}
      {...props}
    >
      {children}
    </button>
  );

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-card rounded-3xl shadow-2xl p-6 border border-border">
        {/* Display */}
        <div className="bg-muted rounded-2xl p-6 mb-6">
          <div className="text-right">
            <div className="text-3xl font-mono text-foreground break-all">
              {display}
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="grid grid-cols-4 gap-3">
          <Button
            onClick={clear}
            className="col-span-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
          >
            AC
          </Button>
          <Button
            onClick={clearEntry}
            className="bg-muted hover:bg-muted/80 text-muted-foreground"
          >
            CE
          </Button>
          <Button
            onClick={backspace}
            className="bg-muted hover:bg-muted/80 text-muted-foreground"
          >
            ⌫
          </Button>

          <Button
            onClick={() => inputNumber('7')}
            className="bg-secondary hover:bg-secondary/80 text-secondary-foreground"
          >
            7
          </Button>
          <Button
            onClick={() => inputNumber('8')}
            className="bg-secondary hover:bg-secondary/80 text-secondary-foreground"
          >
            8
          </Button>
          <Button
            onClick={() => inputNumber('9')}
            className="bg-secondary hover:bg-secondary/80 text-secondary-foreground"
          >
            9
          </Button>
          <Button
            onClick={() => performOperation('÷')}
            className={`bg-accent hover:bg-accent/80 text-accent-foreground ${
              operation === '÷' ? 'ring-2 ring-primary' : ''
            }`}
          >
            ÷
          </Button>

          <Button
            onClick={() => inputNumber('4')}
            className="bg-secondary hover:bg-secondary/80 text-secondary-foreground"
          >
            4
          </Button>
          <Button
            onClick={() => inputNumber('5')}
            className="bg-secondary hover:bg-secondary/80 text-secondary-foreground"
          >
            5
          </Button>
          <Button
            onClick={() => inputNumber('6')}
            className="bg-secondary hover:bg-secondary/80 text-secondary-foreground"
          >
            6
          </Button>
          <Button
            onClick={() => performOperation('×')}
            className={`bg-accent hover:bg-accent/80 text-accent-foreground ${
              operation === '×' ? 'ring-2 ring-primary' : ''
            }`}
          >
            ×
          </Button>

          <Button
            onClick={() => inputNumber('1')}
            className="bg-secondary hover:bg-secondary/80 text-secondary-foreground"
          >
            1
          </Button>
          <Button
            onClick={() => inputNumber('2')}
            className="bg-secondary hover:bg-secondary/80 text-secondary-foreground"
          >
            2
          </Button>
          <Button
            onClick={() => inputNumber('3')}
            className="bg-secondary hover:bg-secondary/80 text-secondary-foreground"
          >
            3
          </Button>
          <Button
            onClick={() => performOperation('-')}
            className={`bg-accent hover:bg-accent/80 text-accent-foreground ${
              operation === '-' ? 'ring-2 ring-primary' : ''
            }`}
          >
            -
          </Button>

          <Button
            onClick={() => inputNumber('0')}
            className="col-span-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground"
          >
            0
          </Button>
          <Button
            onClick={inputDecimal}
            className="bg-secondary hover:bg-secondary/80 text-secondary-foreground"
          >
            .
          </Button>
          <Button
            onClick={() => performOperation('+')}
            className={`bg-accent hover:bg-accent/80 text-accent-foreground ${
              operation === '+' ? 'ring-2 ring-primary' : ''
            }`}
          >
            +
          </Button>

          <Button
            onClick={handleEquals}
            className="col-span-4 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            =
          </Button>
        </div>
      </div>
    </div>
  );
}