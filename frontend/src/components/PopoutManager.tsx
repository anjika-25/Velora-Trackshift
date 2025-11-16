import React, { useState, useEffect } from 'react';
import { Panel } from '../types/models';
import '../styles/dashboard.css';

interface PopoutManagerProps {
  panels: Panel[];
  onPanelUpdate: (panel: Panel) => void;
  children: React.ReactNode;
}

interface PopoutWindow extends Window {
  panel?: Panel;
  updatePanel?: (panel: Panel) => void;
}

const PopoutManager: React.FC<PopoutManagerProps> = ({ panels, onPanelUpdate, children }) => {
  const [poppedWindows, setPoppedWindows] = useState<{ [key: string]: Window | null }>({});

  useEffect(() => {
    // Cleanup function to close all popped windows when component unmounts
    return () => {
      Object.values(poppedWindows).forEach(window => window?.close());
    };
  }, []);

  const popoutPanel = (panel: Panel) => {
    const width = 500;
    const height = 400;
    const left = (window.screen.width - width) / 2;
    const top = (window.screen.height - height) / 2;

    const newWindow = window.open(
      '',
      panel.id,
      `width=${width},height=${height},left=${left},top=${top},resizable=yes`
    ) as PopoutWindow;

    if (newWindow) {
      newWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${panel.title}</title>
            <style>
              body { margin: 0; padding: 16px; background: #1a1a1a; color: white; }
              .panel { background: #2a2a2a; border-radius: 8px; padding: 16px; height: calc(100vh - 48px); }
            </style>
          </head>
          <body>
            <div id="root"></div>
          </body>
        </html>
      `);

      // Store panel data and update function in the window object
      newWindow.panel = panel;
      newWindow.updatePanel = (updatedPanel: Panel) => {
        onPanelUpdate(updatedPanel);
      };

      // Update our state with the new window reference
      setPoppedWindows(prev => ({
        ...prev,
        [panel.id]: newWindow
      }));

      // Handle window close
      newWindow.onbeforeunload = () => {
        onPanelUpdate({ ...panel, isPopped: false });
        setPoppedWindows(prev => ({
          ...prev,
          [panel.id]: null
        }));
      };
    }
  };

  const closePanel = (panelId: string) => {
    const window = poppedWindows[panelId];
    if (window) {
      window.close();
    }
  };

  const togglePopout = (panel: Panel) => {
    if (panel.isPopped) {
      closePanel(panel.id);
    } else {
      popoutPanel(panel);
    }
    onPanelUpdate({ ...panel, isPopped: !panel.isPopped });
  };

  return (
    <div className="dashboard">
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          const panel = panels.find(p => p.id === child.props.id);
          if (panel && !panel.isPopped) {
            return React.cloneElement(child, {
              onPopout: () => togglePopout(panel)
            });
          }
          return null;
        }
        return child;
      })}
    </div>
  );
};

export default PopoutManager;