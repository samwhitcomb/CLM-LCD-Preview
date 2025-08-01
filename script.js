// LCD Resolution Scaling Constants
const LCD_WIDTH = 320;  // New width
const LCD_HEIGHT = 240; // New height
const SCALE_X = LCD_WIDTH / 160;  // Width scale factor (2x)
const SCALE_Y = LCD_HEIGHT / 80;  // Height scale factor (3x)
const CENTER_X = LCD_WIDTH / 2;   // 160
const CENTER_Y = LCD_HEIGHT / 2;  // 120

// Sleep state variables
let isSleepMode = false;
let sleepFadeProgress = 0;
let sleepStartTime = 0;

// Ball management variables
let ballCount = 0;
let isShotInProgress = false;

// Device state variables
let isDevicePoweredOn = false;

// Scale coordinate helper functions
function scaleX(x) { return x * SCALE_X; }
function scaleY(y) { return y * SCALE_Y; }
function scaleSize(size) { return size * Math.min(SCALE_X, SCALE_Y); } // Use minimum scale for consistent sizing

// Add these constants at the top of the file
const TRAY_POSITION = {
    x: scaleX(110),  // Aligned with battery
    y: scaleY(10),   // Same y as battery
    size: scaleSize(10) // Same height as battery
};

const CENTER_POSITION = {
    x: scaleX(80),
    y: scaleY(55),
    size: scaleSize(30)
};

// Add cable state management
let isCableVisible = false;

// Function to update cable visibility
function updateCableVisibility(visible) {
    const cableElement = document.getElementById('cable');
    if (cableElement) {
        cableElement.style.display = visible ? 'block' : 'none';
    }
    isCableVisible = visible;
}

// Battery drawing function
function drawBattery(ctx, level) {
    const x = scaleX(130);  // Position from right
    const y = scaleY(5);    // Position from top
    const width = scaleX(20);
    const height = scaleY(10);
    const radius = scaleSize(0.5);  // Radius for rounded corners
    
    // Battery outline with rounded corners
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.stroke();
    
    // Battery tip (white rectangle)
    ctx.fillStyle = '#fff';
    ctx.fillRect(x + width, y + scaleY(2), scaleX(2), height - scaleY(4));
    
    // Battery level with rounded corners
    const fillWidth = (width - 2) * (level / 100);
    ctx.fillStyle = level > 20 ? '#fff' : '#ff0000';
    ctx.beginPath();
    ctx.moveTo(x + 1 + radius, y + 1);
    ctx.lineTo(x + 1 + fillWidth - radius, y + 1);
    ctx.quadraticCurveTo(x + 1 + fillWidth, y + 1, x + 1 + fillWidth, y + 1 + radius);
    ctx.lineTo(x + 1 + fillWidth, y + height - 1 - radius);
    ctx.quadraticCurveTo(x + 1 + fillWidth, y + height - 1, x + 1 + fillWidth - radius, y + height - 1);
    ctx.lineTo(x + 1 + radius, y + height - 1);
    ctx.quadraticCurveTo(x + 1, y + height - 1, x + 1, y + height - 1 - radius);
    ctx.lineTo(x + 1, y + 1 + radius);
    ctx.quadraticCurveTo(x + 1, y + 1, x + 1 + radius, y + 1);
    ctx.closePath();
    ctx.fill();
}

// Power button animation function
function drawPowerButtonAnimation(ctx, frame, isOff = false) {
    const x = scaleX(140);  // Position from right
    const y = scaleY(40);   // Center vertically
    const arrowLength = scaleX(15);
    const arrowWidth = scaleSize(2);
    const lineHeight = scaleY(20);  // Fixed height
    
    // Calculate breathing effect for the line opacity only
    const lineOpacity = Math.abs(Math.sin(frame * 0.02)) * 0.5 + 0.3;
    
    // Calculate bouncing effect for the arrow - much slower
    const bounceOffset = Math.abs(Math.sin(frame * 0.05)) * 10; // Reduced speed
    const arrowOpacity = 0.8;
    
    // Set color based on device state
    const color = isOff ? '#ff0000' : '#ffffff';
    
    // Draw vertical line (power button) with fixed height
    ctx.strokeStyle = `rgba(${isOff ? '255, 0, 0' : '255, 255, 255'}, ${lineOpacity})`;
    ctx.lineWidth = arrowWidth;
    ctx.beginPath();
    ctx.moveTo(x + 5, y - lineHeight/2);
    ctx.lineTo(x + 5, y + lineHeight/2);
    ctx.stroke();
    
    // Draw bouncing arrow
    ctx.strokeStyle = `rgba(${isOff ? '255, 0, 0' : '255, 255, 255'}, ${arrowOpacity})`;
    ctx.beginPath();
    // Start position of arrow (further left)
    const startX = x - arrowLength - scaleX(20);
    // Current position with bounce
    const currentX = startX + bounceOffset;
    
    ctx.moveTo(currentX, y);
    ctx.lineTo(currentX + arrowLength, y);
    ctx.lineTo(currentX + arrowLength - scaleX(5), y - scaleY(5));
    ctx.moveTo(currentX + arrowLength, y);
    ctx.lineTo(currentX + arrowLength - scaleX(5), y + scaleY(5));
    ctx.stroke();
}

// Shutdown countdown animation
function drawShutdownCountdown(ctx, remainingTime) {
    ctx.fillStyle = '#fff';
    ctx.font = scaleSize(12) + 'px monospace';
    ctx.textAlign = 'left';
    ctx.fillText('Shutting down', scaleX(10), scaleY(30));
    ctx.fillText(Math.ceil(remainingTime), scaleX(10), scaleY(50));
}

// WiFi status drawing function
function drawWifiStatus(ctx, status, frame, isFullHeight = false) {
    const size = isFullHeight ? CENTER_POSITION.size : TRAY_POSITION.size;
    const x = isFullHeight ? CENTER_POSITION.x - size/2 : TRAY_POSITION.x - size/2;
    const y = isFullHeight ? CENTER_POSITION.y - size/2 : TRAY_POSITION.y - size/2;
    
    ctx.save();
    ctx.translate(x, y);
    
    switch(status) {
        case 'searching':
            // Draw searching animation
            const angle = (frame * 0.1) % (Math.PI * 2);
            ctx.beginPath();
            ctx.arc(size/2, size/2, size/2, angle, angle + Math.PI * 1.5);
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = isFullHeight ? 2 : 1;
            ctx.stroke();
            break;
            
        case 'connecting':
            // Draw connecting animation (pulsing)
            const scale = 0.8 + Math.sin(frame * 0.1) * 0.2;
            ctx.beginPath();
            ctx.arc(size/2, size/2, (size/2) * scale, 0, Math.PI * 2);
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = isFullHeight ? 2 : 1;
            ctx.stroke();
            break;
            
        case 'connected':
            // Draw connected symbol
            ctx.beginPath();
            ctx.arc(size/2, size/2, size/2, 0, Math.PI * 2);
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = isFullHeight ? 2 : 1;
            ctx.stroke();
            // Draw check mark
            ctx.beginPath();
            ctx.moveTo(size/3, size/2);
            ctx.lineTo(size/2, size * 2/3);
            ctx.lineTo(size * 2/3, size/3);
            ctx.stroke();
            break;
    }
    
    ctx.restore();
}

// New 3-symbol connection sequence drawing function
function drawConnectionSequence(ctx, frame, connectionState) {
    const centerY = CENTER_Y;
    const symbolSize = scaleSize(25);
    const spacing = scaleX(60);
    const dotSize = scaleSize(4);
    
    // Calculate positions for the 3 symbols to span full LCD width
    const deviceX = scaleX(20);  // Very left position
    const wifiX = CENTER_X + scaleX(5);      // Center position
    const globeX = scaleX(145);  // Very right edge position
    
    // Draw custom SVG symbols with color based on connection state
    const drawSymbol = (whiteImg, greenImg, x, y, size, isGreen = false) => {
        const img = isGreen ? greenImg : whiteImg;
        if (img && img.complete) {
            const scale = size / Math.max(img.width, img.height);
            const drawWidth = img.width * scale;
            const drawHeight = img.height * scale;
            const drawX = x - drawWidth / 2;
            const drawY = y - drawHeight / 2;
            
            ctx.save();
            ctx.globalCompositeOperation = 'source-over';
            ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
            ctx.restore();
        }
    };
    
    // Determine which symbols should be green based on connection state
    const deviceConnected = connectionState === 'searching' || connectionState === 'connecting' || connectionState === 'connected' || connectionState === 'internet_failed';
    const computerConnected = connectionState === 'connecting' || connectionState === 'connected' || connectionState === 'internet_failed';
    const globeConnected = connectionState === 'connected';
    
    // Draw device symbol (larger)
    drawSymbol(deviceImg, deviceImgGreen, deviceX, centerY, symbolSize * 1.5, deviceConnected);
    
    // Draw WiFi symbol (normal size)
    drawSymbol(wifiImg, wifiImgGreen, wifiX, centerY, symbolSize, computerConnected);
    
    // Draw globe symbol (normal size)
    drawSymbol(globeImg, globeImgGreen, globeX, centerY, symbolSize, globeConnected);
    
    // Determine connection state and animation
    let firstConnectionComplete = false;
    let secondConnectionComplete = false;
    let currentDotPosition = 0;
    
    switch(connectionState) {
        case 'searching':
            // Device trying to connect to WiFi
            currentDotPosition = (frame * 0.08) % 2; // Animate between first and second dot
            break;
        case 'connecting':
            // WiFi connected, trying to connect to internet
            firstConnectionComplete = true;
            currentDotPosition = 1 + (frame * 0.08) % 2; // Animate between second and third dot
            break;
        case 'connected':
            // All connected
            firstConnectionComplete = true;
            secondConnectionComplete = true;
            break;
        case 'internet_failed':
            // Device and computer connected, but internet failed
            firstConnectionComplete = true;
            break;
    }
    
    // Draw animated dots or checkmarks - exactly halfway between symbols
    const dotPositions = [
        { x: (deviceX + wifiX) / 2, y: centerY }, // Exactly halfway between device and computer
        { x: (wifiX + globeX) / 2, y: centerY },  // Exactly halfway between computer and globe
    ];
    
    // Draw dots with pulsing effect - only show relevant dots
    if (connectionState === 'searching') {
        // Only show first dot when searching
        const pos = dotPositions[0];
        const isActive = Math.floor(currentDotPosition) === 0;
        
        if (isActive) {
            const pulseScale = 1 + Math.sin(frame * 0.2) * 0.3;
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, dotSize * pulseScale, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, dotSize, 0, Math.PI * 2);
            ctx.stroke();
        }
    } else if (connectionState === 'connecting') {
        // Show first dot as checkmark and second dot as blinking
        // First dot (completed)
        drawCheckmark(ctx, dotPositions[0].x, centerY, dotSize, '#00ff00');
        
        // Second dot (blinking)
        const pos = dotPositions[1];
        const isActive = Math.floor(currentDotPosition) === 1;
        
        if (isActive) {
            const pulseScale = 1 + Math.sin(frame * 0.2) * 0.3;
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, dotSize * pulseScale, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, dotSize, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
    
    // Draw final checkmarks when both connections are complete
    if (connectionState === 'connected') {
        drawCheckmark(ctx, dotPositions[0].x, centerY, dotSize, '#00ff00');
        drawCheckmark(ctx, dotPositions[1].x, centerY, dotSize, '#00ff00');
    }
    
    // Draw red cross when connection fails
    if (connectionState === 'failed') {
        drawXmark(ctx, dotPositions[0].x, centerY, dotSize, '#ff0000');
    }
    
    // Draw green checkmark for first connection and red cross for second when internet fails
    if (connectionState === 'internet_failed') {
        drawCheckmark(ctx, dotPositions[0].x, centerY, dotSize, '#00ff00');
        drawXmark(ctx, dotPositions[1].x, centerY, dotSize, '#ff0000');
    }
}

// Add charger detection
let isChargerConnected = false;
let updateProgress = 0;

// Preload connection sequence images
let deviceImg = null;
let wifiImg = null;
let globeImg = null;
let deviceImgGreen = null;
let wifiImgGreen = null;
let globeImgGreen = null;
let tickGif = null;
let dotAnimationGif = null;

function loadConnectionImages() {
    deviceImg = new Image();
    deviceImg.src = 'Assets/Reference/Device.svg';
    
    wifiImg = new Image();
    wifiImg.src = 'Assets/Reference/Computer.svg';
    
    globeImg = new Image();
    globeImg.src = 'Assets/Reference/Global connect.svg';
    
    // Load green versions
    deviceImgGreen = new Image();
    deviceImgGreen.src = 'Assets/Reference/Device-green.svg';
    
    wifiImgGreen = new Image();
    wifiImgGreen.src = 'Assets/Reference/Computer-green.svg';
    
    globeImgGreen = new Image();
    globeImgGreen.src = 'Assets/Reference/Global connect-green.svg';
    
    // Load tick GIF
    tickGif = new Image();
    tickGif.onload = () => {
        console.log('Tick GIF loaded successfully:', tickGif.naturalWidth, 'x', tickGif.naturalHeight);
    };
    tickGif.onerror = () => {
        console.error('Failed to load tick GIF');
    };
    tickGif.src = 'Assets/Reference/Tick Market.gif';
    
    // Load dot animation GIF
    dotAnimationGif = new Image();
    dotAnimationGif.onload = () => {
        console.log('Dot animation GIF loaded successfully:', dotAnimationGif.naturalWidth, 'x', dotAnimationGif.naturalHeight);
    };
    dotAnimationGif.onerror = () => {
        console.error('Failed to load dot animation GIF');
    };
    dotAnimationGif.src = 'Assets/Reference/dot animation.gif';
}

// Flow definitions
const flows = {
    power: [
        {
            title: "Off",
            explanation: "Device is powered off. This would be done through software or by removing the cable.",
            draw: (ctx, frame) => {
                // Clear canvas with black (screen is off)
                ctx.fillStyle = '#000';
                ctx.fillRect(0, 0, LCD_WIDTH, LCD_HEIGHT);
            },
            led: { state: 'off', color: 'none' },
            onEnter: () => {
                // Reset all connection states
                connectionState = 'searching';
                
                let frame = 0;
                const animate = () => {
                    const currentStates = flows[currentFlow];
                    const currentState = currentStates[currentStateIndex];
                    if (currentState.title === "Off") {
                        currentState.draw(ctx, frame++);
                        requestAnimationFrame(animate);
                    }
                };
                animate();
            }
        },
        {
            title: "Power On",
            explanation: "Device is powering on with logo fade in.",
            draw: (ctx, frame) => {
                // Animation timing (60fps) - 1.5x longer
                const fadeInDuration = 90; // 1.5 seconds fade in
                const holdDuration = 270; // 4.5 seconds hold
                const fadeOutDuration = 180; // 3 seconds fade out
                const totalDuration = fadeInDuration + holdDuration + fadeOutDuration; // 9 seconds total
                
                // Calculate opacity based on animation phase
                let opacity;
                if (frame < fadeInDuration) {
                    // Fade in phase
                    opacity = frame / fadeInDuration;
                } else if (frame < fadeInDuration + holdDuration) {
                    // Hold phase
                    opacity = 1;
                } else {
                    // Fade out phase
                    const fadeOutFrame = frame - (fadeInDuration + holdDuration);
                    opacity = Math.max(0, 1 - (fadeOutFrame / fadeOutDuration));
                }
                
                // Clear canvas
                ctx.fillStyle = '#000';
                ctx.fillRect(0, 0, LCD_WIDTH, LCD_HEIGHT);
                
                // Draw DS logo with calculated opacity
                const img = new Image();
                img.src = 'DS LOGO.png';
                
                // Calculate dimensions to maintain aspect ratio
                const maxWidth = scaleX(150); // Leave some margin
                const scale = maxWidth / img.width;
                const width = img.width * scale;
                const height = img.height * scale;
                
                // Center the logo
                const x = (LCD_WIDTH - width) / 2;
                const y = ((LCD_HEIGHT - height) / 2);
                
                ctx.globalAlpha = opacity;
                ctx.drawImage(img, x, y, width, height);
                ctx.globalAlpha = 1;
            },
            led: { state: 'on', color: 'white' },
            onEnter: () => {
                let frame = 0;
                const animate = () => {
                    const currentStates = flows[currentFlow];
                    const currentState = currentStates[currentStateIndex];
                    if (currentState.title === "Power On") {
                        currentState.draw(ctx, frame++);
                        if (frame < 540) { // Continue animation until fade is complete (9 seconds total)
                            requestAnimationFrame(animate);
                        } else {
                            // After fade in completes, move to On state
                            currentStateIndex = 2; // Move to On state
                            updateDisplay();
                        }
                    }
                };
                animate();
            }
        },
        {
            title: "On",
            explanation: "Device is powered on. It is automatically searching for a connection. (Additional option found in connection flow)",
            draw: (ctx, frame) => {
                ctx.fillStyle = '#000';
                ctx.fillRect(0, 0, LCD_WIDTH, LCD_HEIGHT);
                
                // Calculate transition progress
                const transitionStart = 540; // When connection is established + 1 second pause (9 seconds total)
                const transitionDuration = 60; // 1 second transition
                const transitionProgress = Math.min(1, Math.max(0, (frame - transitionStart) / transitionDuration));
                
                // Battery indicator removed from power flow
                
                // Draw new 3-symbol connection sequence with minimizing animation
                if (connectionState === 'connected' && frame >= transitionStart && transitionProgress < 1) {
                    // Calculate positions for minimizing animation
                    const startSize = scaleSize(15);
                    const endSize = TRAY_POSITION.size;
                    
                    // Center positions (accounting for size)
                    const startX = CENTER_X - startSize/2;  // Center of screen
                    const startY = CENTER_Y - startSize/2;  // Center of screen
                    const endX = TRAY_POSITION.x - endSize/2;     // Tray position
                    const endY = TRAY_POSITION.y - endSize/2;     // Tray position
                    
                    // Interpolate position and size
                    const currentSize = startSize + (endSize - startSize) * transitionProgress;
                    const currentX = startX + (endX - startX) * transitionProgress;
                    const currentY = startY + (endY - startY) * transitionProgress;
                    
                    // Draw the minimizing animation
                    ctx.save();
                    ctx.translate(currentX, currentY);
                    ctx.scale(currentSize/startSize, currentSize/startSize);
                    
                    // Draw minimized connection sequence
                    drawMinimizedConnectionSequence(ctx, frame, transitionProgress);
                    ctx.restore();
                } else {
                    // Draw full size connection sequence
                    drawConnectionSequence(ctx, frame, connectionState);
                }

                // Draw subtle status text
                ctx.globalAlpha = 0.5;
                ctx.fillStyle = '#fff'; // White text
                ctx.font = scaleSize(10) + 'px monospace';
                ctx.textAlign = 'left';
                
                
                ctx.globalAlpha = 1;
            },
            led: { state: 'breathing', color: 'blue' },
            onEnter: () => {
                let frame = 0;
                connectionState = 'searching';
                
                const animate = () => {
                    const currentStates = flows[currentFlow];
                    const currentState = currentStates[currentStateIndex];
                    if (currentState.title === "On") {
                        currentState.draw(ctx, frame++);
                        
                        // Update LED state based on connection state and frame
                        if (connectionState === 'searching' || connectionState === 'connecting') {
                            currentState.led = { state: 'breathing', color: 'blue' };
                        } else if (connectionState === 'connected') {
                            if (frame >= 600) { // Wait for transition to complete (10 seconds total - 1 second pause + 1 second transition)
                                // Transition to Fully On state
                                currentStateIndex = 3; // Move to Fully On state
                                updateDisplay();
                                return;
                            } else {
                                currentState.led = { state: 'on', color: 'green' };
                            }
                        }
                        
                        // Update the LED display
                        ledLight.className = 'led-light';
                        ledLight.classList.add(currentState.led.state);
                        ledLight.classList.add(currentState.led.color);
                        if (currentState.led.state === 'on') {
                            ledLight.classList.add('on');
                        }
                        
                        // Simulate connection process with new 3-step sequence
                        if (frame === 180) { // After 3 seconds - device connects to WiFi
                            connectionState = 'connecting';
                        } else if (frame === 420) { // After 7 seconds - WiFi connects to internet
                            connectionState = 'connected';
                            // Play success sound when connection is established
                            const successSound = new Audio('Assets/game sounds/success3.mp3');
                            successSound.volume = 0.5;
                            successSound.play().catch(e => console.log('Audio play failed:', e));
                        }
                        
                        requestAnimationFrame(animate);
                    }
                };
                animate();
            }
        },
        {
            title: "Fully On",
            explanation: "Device is fully powered on and connected.",
            draw: (ctx, frame) => {
                ctx.fillStyle = '#000';
                ctx.fillRect(0, 0, LCD_WIDTH, LCD_HEIGHT);
                
                // Draw minimized connection indicator in tray position
                drawMinimizedConnectionSequence(ctx, frame, 1);
            },
            led: { state: 'on', color: 'green' }
        },
       
    ],
    
    firmwareUpdate: [
        
        {
            title: "Update Ready",
            explanation: "Firmware update ready to start",
            draw: (ctx, frame) => {
                ctx.fillStyle = '#000';
                ctx.fillRect(0, 0, LCD_WIDTH, LCD_HEIGHT);
                


                // Show alternating text every 3 seconds
                const showFirmware = Math.floor(frame / 180) % 2 === 0; // Switch every 3 seconds (180 frames at 60fps)
                
                if (true) {
                    // Draw text at the top
                    ctx.fillStyle = '#fff';
                    ctx.font = scaleSize(16) + 'px Barlow Light';
                    ctx.fontWeight = '300';
                    ctx.textAlign = 'center';
                    
                    if (showFirmware) {
                        ctx.fillText('Firmware 1.43', CENTER_X, scaleY(38));
                    } else {
                        ctx.fillText('Do not disconnect', CENTER_X, scaleY(38));
                    }

                    ctx.fillStyle = '#fff';
                    ctx.font = scaleSize(20) + 'px Barlow Light';
                    ctx.fontWeight = '400';
                    ctx.textAlign = 'center';
                    ctx.fillText('Ready', CENTER_X, scaleY(56));
                }

                // Draw linked green icon in tray position
                const linkedGreenImg = new Image();
                linkedGreenImg.src = 'Assets/Reference/Linked Green.png';

                if (linkedGreenImg.complete) {
                    const traySize = scaleSize(12);
                    const trayX = canvas.width - traySize - 10; // 10px from right edge
                    const trayY = 50; // 50px from top

                    const scale = traySize / Math.max(linkedGreenImg.width, linkedGreenImg.height);
                    const drawWidth = linkedGreenImg.width * scale;
                    const drawHeight = linkedGreenImg.height * scale;
                    const drawX = trayX - drawWidth / 2;
                    const drawY = trayY - drawHeight / 2;

                    ctx.drawImage(linkedGreenImg, drawX, drawY, drawWidth, drawHeight);
                }
            },
            led: { state: 'breathing', color: 'yellow' },
            onEnter: () => {
                let frame = 0;
                const animate = () => {
                    const currentStates = flows[currentFlow];
                    const currentState = currentStates[currentStateIndex];
                    if (currentState.title === "Update Ready") {
                        currentState.draw(ctx, frame++);
                        requestAnimationFrame(animate);
                    }
                };
                animate();
            }
        },
        {
            title: "Updating",
            explanation: "Firmware update in progress",
            draw: (ctx, frame) => {
                ctx.fillStyle = '#000';
                ctx.fillRect(0, 0, LCD_WIDTH, LCD_HEIGHT);
                
                // Draw text at the top
                ctx.fillStyle = '#fff';
                ctx.font = scaleSize(15) + 'px Barlow Light';
                ctx.fontWeight = '300';
                ctx.textAlign = 'center';
                ctx.fillText('Fw 1.43', CENTER_X, scaleY(22));
                ctx.font = scaleSize(12) + 'px Barlow Light';
                ctx.fontWeight = '300';
                ctx.textAlign = 'center';
                ctx.fillText('Do not Disconnect', CENTER_X, scaleY(32));
                
                // Calculate progress and time
                const totalDuration = 30; // 30 seconds total
                const elapsedTime = frame / 60; // Convert frames to seconds
                const progress = Math.min(1, elapsedTime / totalDuration);
                updateProgress = progress; // Update global progress
                
                // Calculate remaining time
                const remainingTime = Math.max(0, totalDuration - elapsedTime);
                const minutes = Math.floor(remainingTime / 60);
                const seconds = Math.floor(remainingTime % 60);
                
                // Draw progress bar in the middle (full width)
                const barWidth = 300; // Full width
                const barHeight = 12;
                const barX = (320 - barWidth) / 2;
                const barY = 110; // Moved up slightly
                const radius = barHeight / 2;
                
                // Draw background bar
                ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                ctx.beginPath();
                ctx.moveTo(barX + radius, barY);
                ctx.lineTo(barX + barWidth - radius, barY);
                ctx.quadraticCurveTo(barX + barWidth, barY, barX + barWidth, barY + radius);
                ctx.lineTo(barX + barWidth, barY + barHeight - radius);
                ctx.quadraticCurveTo(barX + barWidth, barY + barHeight, barX + barWidth - radius, barY + barHeight);
                ctx.lineTo(barX + radius, barY + barHeight);
                ctx.quadraticCurveTo(barX, barY + barHeight, barX, barY + barHeight - radius);
                ctx.lineTo(barX, barY + radius);
                ctx.quadraticCurveTo(barX, barY, barX + radius, barY);
                ctx.closePath();
                ctx.fill();
                
                // Draw progress fill
                const fillWidth = barWidth * progress;
                if (fillWidth > 0) {
                    ctx.fillStyle = '#fff';
                    ctx.beginPath();
                    ctx.moveTo(barX + radius, barY);
                    ctx.lineTo(barX + fillWidth - radius, barY);
                    ctx.quadraticCurveTo(barX + fillWidth, barY, barX + fillWidth, barY + radius);
                    ctx.lineTo(barX + fillWidth, barY + barHeight - radius);
                    ctx.quadraticCurveTo(barX + fillWidth, barY + barHeight, barX + fillWidth - radius, barY + barHeight);
                    ctx.lineTo(barX + radius, barY + barHeight);
                    ctx.quadraticCurveTo(barX, barY + barHeight, barX, barY + barHeight - radius);
                    ctx.lineTo(barX, barY + radius);
                    ctx.quadraticCurveTo(barX, barY, barX + radius, barY);
                    ctx.closePath();
                    ctx.fill();
                }
                
                
                // Draw countdown at bottom right (static position)
                ctx.font = scaleSize(32) + 'px Barlow Light';
                ctx.textAlign = 'right';
                const timeText = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                ctx.fillText(timeText, 215, 190);
                
                              // Lightning bolt removed
                
                // Draw linked green icon in tray position
                const linkedGreenImg = new Image();
                linkedGreenImg.src = 'Assets/Reference/Linked Green.png';

                if (linkedGreenImg.complete) {
                    const traySize = scaleSize(12);
                    const trayX = canvas.width - traySize - 10; // 10px from right edge
                    const trayY = 50; // 50px from top

                    const scale = traySize / Math.max(linkedGreenImg.width, linkedGreenImg.height);
                    const drawWidth = linkedGreenImg.width * scale;
                    const drawHeight = linkedGreenImg.height * scale;
                    const drawX = trayX - drawWidth / 2;
                    const drawY = trayY - drawHeight / 2;

                    ctx.drawImage(linkedGreenImg, drawX, drawY, drawWidth, drawHeight);
                }
                
                // Move to next state when complete
                if (progress >= 1) {
                    currentStateIndex = 2; // Move to Update Complete
                    updateDisplay();
                }

                // Cable visibility removed
            },
            led: { state: 'breathing', color: 'yellow' },
            onEnter: () => {
                let frame = 0;
                const animate = () => {
                    const currentStates = flows[currentFlow];
                    const currentState = currentStates[currentStateIndex];
                    if (currentState.title === "Updating") {
                        currentState.draw(ctx, frame++);
                        
                        // Commented out simulation triggers to allow normal firmware update completion
                        // Simulate charger disconnect after 15 seconds
                        // if (frame === 900) { // 15 seconds at 60fps
                        //     currentStateIndex = 3; // Move to Charger Disconnected state
                        //     updateDisplay();
                        //     return;
                        // }
                        
                        // Simulate update failure after 20 seconds
                        // if (frame === 1200) { // 20 seconds at 60fps
                        //     currentStateIndex = 4; // Move to Update Failed state
                        //     updateDisplay();
                        //     return;
                        // }
                        
                        requestAnimationFrame(animate);
                    }
                };
                animate();
            }
        },
        {
            title: "Update Complete",
            explanation: "Firmware update completed successfully.",
            draw: (ctx, frame) => {
                ctx.fillStyle = '#000';
                ctx.fillRect(0, 0, LCD_WIDTH, LCD_HEIGHT);
                const shouldContinue = drawSuccessAnimation(ctx, frame);
                // Removed transition to non-existent Restarting state
                // The success animation will complete and stay on this state

                // Draw linked green icon in tray position
                const linkedGreenImg = new Image();
                linkedGreenImg.src = 'Assets/Reference/Linked Green.png';

                if (linkedGreenImg.complete) {
                    const traySize = scaleSize(12);
                    const trayX = canvas.width - traySize - 10; // 10px from right edge
                    const trayY = 50; // 50px from top

                    const scale = traySize / Math.max(linkedGreenImg.width, linkedGreenImg.height);
                    const drawWidth = linkedGreenImg.width * scale;
                    const drawHeight = linkedGreenImg.height * scale;
                    const drawX = trayX - drawWidth / 2;
                    const drawY = trayY - drawHeight / 2;

                    ctx.drawImage(linkedGreenImg, drawX, drawY, drawWidth, drawHeight);
                }
            },
            led: { state: 'on', color: 'green' },
            onEnter: () => {
                // Play success sound
                const successSound = new Audio('Assets/game sounds/success3.mp3');
                successSound.volume = 0.5;
                successSound.play().catch(e => console.log('Audio play failed:', e));
                
                let frame = 0;
                const animate = () => {
                    const currentStates = flows[currentFlow];
                    const currentState = currentStates[currentStateIndex];
                    if (currentState.title === "Update Complete") {
                        currentState.draw(ctx, frame++);
                        requestAnimationFrame(animate);
                    }
                };
                animate();

                // Cable visibility removed
            }
        },
       
    ],
    errorStates: [
        {
            title: "Firmware Update Failed",
            explanation: "Firmware update failed. Please try again.",
            draw: (ctx, frame) => {
                // No background - let animation show through
                
                // Draw error message at the very top
                ctx.save();
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.textBaseline = 'alphabetic';
                ctx.fillStyle = '#fff';
                ctx.font = `300 ${scaleSize(14)}px 'Barlow', sans-serif`;
                ctx.textAlign = 'left';
                ctx.fillText('Firmware', scaleX(55), CENTER_Y - scaleSize(5));
                ctx.fillText('Update Failed', scaleX(55), CENTER_Y + scaleSize(12));
                ctx.restore();
            },
            led: { state: 'breathing', color: 'red' },
            onEnter: () => {
                // Create a container for the error GIF
                const gifContainer = document.createElement('div');
                gifContainer.style.position = 'absolute';
                gifContainer.style.top = 0 + 'px';
                gifContainer.style.left = 0 + 'px';
                gifContainer.style.width = canvas.width + 'px';
                gifContainer.style.height = canvas.height + 'px';
                gifContainer.style.zIndex = '0';
                gifContainer.style.pointerEvents = 'none';
                canvas.parentNode.appendChild(gifContainer);

                // Create and load the error GIF
                const img = document.createElement('img');
                img.src = 'Assets/Main Gif/Error.gif';
                img.style.position = 'absolute';
                img.style.width = '100%';
                img.style.height = '100%';
                img.style.left = '0px';
                img.style.top = '0px';
                img.style.objectFit = 'contain';
                gifContainer.appendChild(img);

                // Play error sound
                const errorSound1 = new Audio('Assets/game sounds/neg3.mp3');
                errorSound1.volume = 0.5;
                errorSound1.play().catch(e => console.log('Audio play failed:', e));

                let frame = 0;
                let startTime = Date.now();
                const animate = () => {
                    const currentStates = flows[currentFlow];
                    const currentState = currentStates[currentStateIndex];
                    if (currentState.title === "Firmware Update Failed") {
                        const elapsedTime = Date.now() - startTime;
                        
                        // After Error.gif plays for about 2 seconds, switch to Error Cycle.gif
                        if (elapsedTime >= 2000 && elapsedTime < 2001) {
                            window.errorCycleStartTime = Date.now();
                            img.src = 'Assets/Main Gif/Error Cycle.gif';
                        }
                        // After Error Cycle.gif plays for about 2 seconds, switch to Ready.png
                        else if (elapsedTime >= 2001) {
                            img.src = 'Assets/Main Gif/Error.png';
                        }
                        
                        currentState.draw(ctx, frame++);
                        requestAnimationFrame(animate);
                    } else {
                        // Cleanup when switching away
                        if (gifContainer.parentNode) {
                            gifContainer.parentNode.removeChild(gifContainer);
                        }
                    }
                };
                animate();
            }
        },
        {
            title: "Unit Disconnected",
            explanation: "Unit has been disconnected. Please reconnect and try again.",
            draw: (ctx, frame) => {
                // No background - let animation show through
                
                // Draw error message at the very top
                ctx.save();
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.textBaseline = 'alphabetic';
                ctx.fillStyle = '#fff';
                ctx.font = `300 ${scaleSize(14)}px 'Barlow', sans-serif`;
                ctx.textAlign = 'left';
                ctx.fillText('Unit', scaleX(55), CENTER_Y - scaleSize(5));
                ctx.fillText('Disconnected', scaleX(55), CENTER_Y + scaleSize(12));
                ctx.restore();
            },
            led: { state: 'breathing', color: 'red' },
            onEnter: () => {
                // Create a container for the error GIF
                const gifContainer = document.createElement('div');
                gifContainer.style.position = 'absolute';
                gifContainer.style.top = 0 + 'px';
                gifContainer.style.left = 0 + 'px';
                gifContainer.style.width = canvas.width + 'px';
                gifContainer.style.height = canvas.height + 'px';
                gifContainer.style.zIndex = '0';
                gifContainer.style.pointerEvents = 'none';
                canvas.parentNode.appendChild(gifContainer);

                // Create and load the error GIF
                const img = document.createElement('img');
                img.src = 'Assets/Main Gif/Error.gif';
                img.style.position = 'absolute';
                img.style.width = '100%';
                img.style.height = '100%';
                img.style.left = '0px';
                img.style.top = '0px';
                img.style.objectFit = 'contain';
                gifContainer.appendChild(img);

                // Play error sound
                const errorSound1 = new Audio('Assets/game sounds/neg3.mp3');
                errorSound1.volume = 0.5;
                errorSound1.play().catch(e => console.log('Audio play failed:', e));

                let frame = 0;
                let startTime = Date.now();
                const animate = () => {
                    const currentStates = flows[currentFlow];
                    const currentState = currentStates[currentStateIndex];
                    if (currentState.title === "Unit Disconnected") {
                        const elapsedTime = Date.now() - startTime;
                        
                        // After Error.gif plays for about 2 seconds, switch to Error Cycle.gif
                        if (elapsedTime >= 2000 && elapsedTime < 2001) {
                            window.errorCycleStartTime = Date.now();
                            img.src = 'Assets/Main Gif/Error Cycle.gif';
                        }
                        // After Error Cycle.gif plays for about 2 seconds, switch to Ready.png
                        else if (elapsedTime >= 2001) {
                            img.src = 'Assets/Main Gif/Error.png';
                        }
                        
                        currentState.draw(ctx, frame++);
                        requestAnimationFrame(animate);
                    } else {
                        // Cleanup when switching away
                        if (gifContainer.parentNode) {
                            gifContainer.parentNode.removeChild(gifContainer);
                        }
                    }
                };
                animate();
            }
        },
        {
            title: "Unit Overheating",
            explanation: "Unit is overheating. Please allow it to cool down.",
            draw: (ctx, frame) => {
                // No background - let animation show through
                
                // Draw error message at the very top
                ctx.save();
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.textBaseline = 'alphabetic';
                ctx.fillStyle = '#fff';
                ctx.font = `300 ${scaleSize(14)}px 'Barlow', sans-serif`;
                ctx.textAlign = 'left';
                ctx.fillText('Unit', scaleX(55), CENTER_Y - scaleSize(5));
                ctx.fillText('Overheating', scaleX(55), CENTER_Y + scaleSize(12));
                ctx.restore();
            },
            led: { state: 'breathing', color: 'red' },
            onEnter: () => {
                // Create a container for the error GIF
                const gifContainer = document.createElement('div');
                gifContainer.style.position = 'absolute';
                gifContainer.style.top = 0 + 'px';
                gifContainer.style.left = 0 + 'px';
                gifContainer.style.width = canvas.width + 'px';
                gifContainer.style.height = canvas.height + 'px';
                gifContainer.style.zIndex = '0';
                gifContainer.style.pointerEvents = 'none';
                canvas.parentNode.appendChild(gifContainer);

                // Create and load the error GIF
                const img = document.createElement('img');
                img.src = 'Assets/Main Gif/Error.gif';
                img.style.position = 'absolute';
                img.style.width = '100%';
                img.style.height = '100%';
                img.style.left = '0px';
                img.style.top = '0px';
                img.style.objectFit = 'contain';
                gifContainer.appendChild(img);

                // Play error sound
                const errorSound1 = new Audio('Assets/game sounds/neg3.mp3');
                errorSound1.volume = 0.5;
                errorSound1.play().catch(e => console.log('Audio play failed:', e));

                let frame = 0;
                let startTime = Date.now();
                const animate = () => {
                    const currentStates = flows[currentFlow];
                    const currentState = currentStates[currentStateIndex];
                    if (currentState.title === "Unit Overheating") {
                        const elapsedTime = Date.now() - startTime;
                        
                        // After Error.gif plays for about 2 seconds, switch to Error Cycle.gif
                        if (elapsedTime >= 2000 && elapsedTime < 2001) {
                            window.errorCycleStartTime = Date.now();
                            img.src = 'Assets/Main Gif/Error Cycle.gif';
                        }
                        // After Error Cycle.gif plays for about 2 seconds, switch to Ready.png
                        else if (elapsedTime >= 2001) {
                            img.src = 'Assets/Main Gif/Error.png';
                        }
                        
                        currentState.draw(ctx, frame++);
                        requestAnimationFrame(animate);
                    } else {
                        // Cleanup when switching away
                        if (gifContainer.parentNode) {
                            gifContainer.parentNode.removeChild(gifContainer);
                        }
                    }
                };
                animate();
            }
        },
        {
            title: "Calibration Error",
            explanation: "Calibration error detected. Please recalibrate the unit.",
            draw: (ctx, frame) => {
                // No background - let animation show through
                
                // Draw error message at the very top
                ctx.save();
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.textBaseline = 'alphabetic';
                ctx.fillStyle = '#fff';
                ctx.font = `300 ${scaleSize(14)}px 'Barlow', sans-serif`;
                ctx.textAlign = 'left';
                ctx.fillText('Calibration', scaleX(55), CENTER_Y - scaleSize(5));
                ctx.fillText('Error', scaleX(55), CENTER_Y + scaleSize(12));
                ctx.restore();
            },
            led: { state: 'breathing', color: 'red' },
            onEnter: () => {
                // Create a container for the error GIF
                const gifContainer = document.createElement('div');
                gifContainer.style.position = 'absolute';
                gifContainer.style.top = 0 + 'px';
                gifContainer.style.left = 0 + 'px';
                gifContainer.style.width = canvas.width + 'px';
                gifContainer.style.height = canvas.height + 'px';
                gifContainer.style.zIndex = '0';
                gifContainer.style.pointerEvents = 'none';
                canvas.parentNode.appendChild(gifContainer);

                // Create and load the error GIF
                const img = document.createElement('img');
                img.src = 'Assets/Main Gif/Error.gif';
                img.style.position = 'absolute';
                img.style.width = '100%';
                img.style.height = '100%';
                img.style.left = '0px';
                img.style.top = '0px';
                img.style.objectFit = 'contain';
                gifContainer.appendChild(img);

                // Play error sound
                const errorSound1 = new Audio('Assets/game sounds/neg3.mp3');
                errorSound1.volume = 0.5;
                errorSound1.play().catch(e => console.log('Audio play failed:', e));

                let frame = 0;
                let startTime = Date.now();
                const animate = () => {
                    const currentStates = flows[currentFlow];
                    const currentState = currentStates[currentStateIndex];
                    if (currentState.title === "Calibration Error") {
                        const elapsedTime = Date.now() - startTime;
                        
                        // After Error.gif plays for about 2 seconds, switch to Error Cycle.gif
                        if (elapsedTime >= 2000 && elapsedTime < 2001) {
                            window.errorCycleStartTime = Date.now();
                            img.src = 'Assets/Main Gif/Error Cycle.gif';
                        }
                        // After Error Cycle.gif plays for about 2 seconds, switch to Ready.png
                        else if (elapsedTime >= 2001) {
                            img.src = 'Assets/Main Gif/Error.png';
                        }
                        
                        currentState.draw(ctx, frame++);
                        requestAnimationFrame(animate);
                    } else {
                        // Cleanup when switching away
                        if (gifContainer.parentNode) {
                            gifContainer.parentNode.removeChild(gifContainer);
                        }
                    }
                };
                animate();
            }
        },
        {
            title: "Contact Support",
            explanation: "Please contact support for assistance.",
            draw: (ctx, frame) => {
                // No background - let animation show through
                
                // Draw error message at the very top
                ctx.save();
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.textBaseline = 'alphabetic';
                ctx.fillStyle = '#fff';
                ctx.font = `300 ${scaleSize(14)}px 'Barlow', sans-serif`;
                ctx.textAlign = 'left';
                ctx.fillText('Contact', scaleX(55), CENTER_Y - scaleSize(5));
                ctx.fillText('Support', scaleX(55), CENTER_Y + scaleSize(12));
                ctx.restore();
            },
            led: { state: 'breathing', color: 'red' },
            onEnter: () => {
                // Create a container for the error GIF
                const gifContainer = document.createElement('div');
                gifContainer.style.position = 'absolute';
                gifContainer.style.top = 0 + 'px';
                gifContainer.style.left = 0 + 'px';
                gifContainer.style.width = canvas.width + 'px';
                gifContainer.style.height = canvas.height + 'px';
                gifContainer.style.zIndex = '0';
                gifContainer.style.pointerEvents = 'none';
                canvas.parentNode.appendChild(gifContainer);

                // Create and load the error GIF
                const img = document.createElement('img');
                img.src = 'Assets/Main Gif/Error.gif';
                img.style.position = 'absolute';
                img.style.width = '100%';
                img.style.height = '100%';
                img.style.left = '0px';
                img.style.top = '0px';
                img.style.objectFit = 'contain';
                gifContainer.appendChild(img);

                // Play error sound
                const errorSound1 = new Audio('Assets/game sounds/error3.mp3');
                errorSound1.volume = 0.5;
                errorSound1.play().catch(e => console.log('Audio play failed:', e));

                let frame = 0;
                let startTime = Date.now();
                const animate = () => {
                    const currentStates = flows[currentFlow];
                    const currentState = currentStates[currentStateIndex];
                    if (currentState.title === "Contact Support") {
                        const elapsedTime = Date.now() - startTime;
                        
                        // After Error.gif plays for about 2 seconds, switch to Error Cycle.gif
                        if (elapsedTime >= 2000 && elapsedTime < 2001) {
                            window.errorCycleStartTime = Date.now();
                            img.src = 'Assets/Main Gif/Error Cycle.gif';
                        }
                        // After Error Cycle.gif plays for about 2 seconds, switch to Ready.png
                        else if (elapsedTime >= 2001) {
                            img.src = 'Assets/Main Gif/Error.png';
                        }
                        
                                currentState.draw(ctx, frame++);
                                requestAnimationFrame(animate);
                    } else {
                        // Cleanup when switching away
                        if (gifContainer.parentNode) {
                            gifContainer.parentNode.removeChild(gifContainer);
                        }
                    }
                };
                animate();
            }
        },
       
    ],
    PreSetup: [
        {
            title: "Welcome Screen",
            explanation: "First screen of the pre-setup flow showing welcome message for 5 seconds",
            draw: (ctx, frame) => {
                ctx.fillStyle = '#000';
                ctx.fillRect(0, 0, LCD_WIDTH, LCD_HEIGHT);
                
                // Apply fade transition if active
                if (window.preSetupFadeOut) {
                    ctx.globalAlpha = 1 - window.preSetupFadeProgress;
                } else if (window.preSetupFadeIn) {
                    ctx.globalAlpha = 1 - window.preSetupFadeProgress;
                } else {
                    ctx.globalAlpha = 1;
                }
                
                                // Draw welcome text - scaled to fit LCD overlay
                ctx.save();
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.textBaseline = 'alphabetic';
                ctx.fillStyle = '#fff';
                ctx.textAlign = 'center';        
                ctx.font = `300 ${scaleSize(14)}px 'Barlow', sans-serif`;
                ctx.fillText('Welcome User!', CENTER_X, CENTER_Y - scaleSize(15));
                ctx.fillText("Let's get started setting", CENTER_X, CENTER_Y + scaleSize(5));
                ctx.fillText("up your new CLM.", CENTER_X, CENTER_Y + scaleSize(20));
                ctx.restore();
                
                // Reset global alpha
                ctx.globalAlpha = 1;
            },
            led: { state: 'breathing', color: 'yellow' },
            onEnter: () => {
                // Auto-advance after 5 seconds with fade transition
                setTimeout(() => {
                    if (currentFlow === 'PreSetup' && currentStateIndex === 0) {
                        // Start fade out transition
                        window.preSetupFadeOut = true;
                        window.preSetupFadeProgress = 0;
                        
                        const fadeOut = () => {
                            if (window.preSetupFadeOut && window.preSetupFadeProgress < 1) {
                                window.preSetupFadeProgress += 0.05; // 20 steps for smooth fade
                                updateDisplay();
                                requestAnimationFrame(fadeOut);
                            } else if (window.preSetupFadeProgress >= 1) {
                                // Fade out complete, switch to next screen
                                window.preSetupFadeOut = false;
                                window.preSetupFadeProgress = 0;
                                currentStateIndex = 1;
                                updateDisplay();
                            }
                        };
                        fadeOut();
                    }
                }, 5000);
                return null; // Return null to indicate no animation, so draw() will be called
            }
        },
        {
            title: "Download Software",
            explanation: "Second screen asking user to download Rapsodo Studios Suite",
            draw: (ctx, frame) => {
                ctx.fillStyle = '#000';
                ctx.fillRect(0, 0, LCD_WIDTH, LCD_HEIGHT);
                
                // Apply fade transition if active
                if (window.preSetupFadeOut) {
                    ctx.globalAlpha = 1 - window.preSetupFadeProgress;
                } else if (window.preSetupFadeIn) {
                    ctx.globalAlpha = 1 - window.preSetupFadeProgress;
                } else {
                    ctx.globalAlpha = 1;
                }
                
                // Draw computer icon from SVG
                const computerImg = new Image();
                computerImg.src = 'Assets/Reference/Computer.svg';
                
                if (computerImg.complete) {
                    const iconSize = scaleSize(25);
                    const iconX = CENTER_X - iconSize / 2;
                    const iconY = CENTER_Y - scaleSize(22) - iconSize / 2;
                    
                    const scale = iconSize / Math.max(computerImg.width, computerImg.height);
                    const drawWidth = computerImg.width * scale;
                    const drawHeight = computerImg.height * scale;
                    const drawX = iconX + (iconSize - drawWidth) / 2;
                    const drawY = iconY + (iconSize - drawHeight) / 2;
                    
                    ctx.drawImage(computerImg, drawX, drawY, drawWidth, drawHeight);
                }
                
                // Draw text
                ctx.save();
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.textBaseline = 'alphabetic';
                ctx.fillStyle = '#fff';
                ctx.font = `300 ${scaleSize(14)}px 'Barlow', sans-serif`;
                ctx.textAlign = 'center';
                ctx.fillText('Download the', CENTER_X, CENTER_Y + scaleSize(10));
                ctx.fillText('Rapsodo Studios Suite', CENTER_X, CENTER_Y + scaleSize(25));
                ctx.restore();
                
                // Draw pagination slots
                ctx.strokeStyle = '#666';
                ctx.lineWidth = scaleSize(1);
                ctx.beginPath();
                ctx.arc(CENTER_X - scaleSize(6), CENTER_Y + scaleSize(35), scaleSize(2.5), 0, 2 * Math.PI);
                ctx.stroke();
                
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(CENTER_X + scaleSize(6), CENTER_Y + scaleSize(35), scaleSize(2.5), 0, 2 * Math.PI);
                ctx.fill();
                
                // Reset global alpha
                ctx.globalAlpha = 1;
            },
            led: { state: 'breathing', color: 'yellow' },
            onEnter: () => {
                // Start fade in if coming from welcome screen
                if (window.preSetupFadeOut === false && window.preSetupFadeProgress === 0) {
                    window.preSetupFadeIn = true;
                    window.preSetupFadeProgress = 1;
                    
                    const fadeIn = () => {
                        if (window.preSetupFadeIn && window.preSetupFadeProgress > 0) {
                            window.preSetupFadeProgress -= 0.05; // 20 steps for smooth fade
                            updateDisplay();
                            requestAnimationFrame(fadeIn);
                        } else if (window.preSetupFadeProgress <= 0) {
                            // Fade in complete
                            window.preSetupFadeIn = false;
                            window.preSetupFadeProgress = 0;
                        }
                    };
                    fadeIn();
                }
                
                // Start rotation timer
                if (!window.preSetupRotationTimer) {
                    window.preSetupRotationTimer = setInterval(() => {
                        if (currentFlow === 'PreSetup' && currentStateIndex >= 1) {
                            // Start fade out transition
                            window.preSetupFadeOut = true;
                            window.preSetupFadeProgress = 0;
                            
                            const fadeOut = () => {
                                if (window.preSetupFadeOut && window.preSetupFadeProgress < 1) {
                                    window.preSetupFadeProgress += 0.05; // 20 steps for smooth fade
                                    updateDisplay();
                                    requestAnimationFrame(fadeOut);
                                } else if (window.preSetupFadeProgress >= 1) {
                                    // Fade out complete, switch to next screen
                                    window.preSetupFadeOut = false;
                                    window.preSetupFadeProgress = 0;
                                    currentStateIndex = currentStateIndex === 1 ? 2 : 1;
                                    updateDisplay();
                                }
                            };
                            fadeOut();
                        }
                    }, 3000); // Switch every 3 seconds
                }
                return null; // Return null to indicate no animation, so draw() will be called
            },
            onExit: () => {
                // Clear rotation timer when leaving this flow
                if (window.preSetupRotationTimer) {
                    clearInterval(window.preSetupRotationTimer);
                    window.preSetupRotationTimer = null;
                }
                
                // Clear fade transition states
                window.preSetupFadeOut = false;
                window.preSetupFadeIn = false;
                window.preSetupFadeProgress = 0;
            }
        },
        {
            title: "Connect to PC",
            explanation: "Third screen asking user to connect to PC using ethernet cable with plugin animation",
            draw: (ctx, frame) => {
                ctx.fillStyle = '#000';
                ctx.fillRect(0, 0, LCD_WIDTH, LCD_HEIGHT);
                
                // Apply fade transition if active
                if (window.preSetupFadeOut) {
                    ctx.globalAlpha = 1 - window.preSetupFadeProgress;
                } else if (window.preSetupFadeIn) {
                    ctx.globalAlpha = 1 - window.preSetupFadeProgress;
                } else {
                    ctx.globalAlpha = 1;
                }
                
                // Draw text
                ctx.save();
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.textBaseline = 'alphabetic';
                ctx.fillStyle = '#fff';
                ctx.font = `300 ${scaleSize(14)}px 'Barlow', sans-serif`;
                ctx.textAlign = 'center';
                ctx.fillText('Connect to PC using', CENTER_X, CENTER_Y + scaleSize(10));
                ctx.fillText('ethernet Cable', CENTER_X, CENTER_Y + scaleSize(25));
                ctx.restore();
                
                // Draw pagination slots
                ctx.fillStyle = '#fff';
                ctx.beginPath();
                ctx.arc(CENTER_X - scaleSize(6), CENTER_Y + scaleSize(35), scaleSize(2.5), 0, 2 * Math.PI);
                ctx.fill();
                
                ctx.strokeStyle = '#666';
                ctx.lineWidth = scaleSize(1);
                ctx.beginPath();
                ctx.arc(CENTER_X + scaleSize(6), CENTER_Y + scaleSize(35), scaleSize(2.5), 0, 2 * Math.PI);
                ctx.stroke();
                
                // Reset global alpha
                ctx.globalAlpha = 1;
            },
            led: { state: 'breathing', color: 'yellow' },
            onEnter: () => {
                // Start fade in if coming from previous screen
                if (window.preSetupFadeOut === false && window.preSetupFadeProgress === 0) {
                    window.preSetupFadeIn = true;
                    window.preSetupFadeProgress = 1;
                    
                    const fadeIn = () => {
                        if (window.preSetupFadeIn && window.preSetupFadeProgress > 0) {
                            window.preSetupFadeProgress -= 0.05; // 20 steps for smooth fade
                            updateDisplay();
                            requestAnimationFrame(fadeIn);
                        } else if (window.preSetupFadeProgress <= 0) {
                            // Fade in complete
                            window.preSetupFadeIn = false;
                            window.preSetupFadeProgress = 0;
                        }
                    };
                    fadeIn();
                }
                
                // Continue rotation timer from previous screen
                
                // Create plugin animation container (using same approach as error states)
                const gifContainer = document.createElement('div');
                gifContainer.style.position = 'absolute';
                gifContainer.style.top = 0 + 'px';
                gifContainer.style.left = 0 + 'px';
                gifContainer.style.width = canvas.width + 'px';
                gifContainer.style.height = canvas.height + 'px';
                gifContainer.style.zIndex = '0';
                gifContainer.style.pointerEvents = 'none';
                canvas.parentNode.appendChild(gifContainer);
                
                // Create and position the plugin animation GIF
                const img = document.createElement('img');
                img.src = 'Assets/Main Gif/plugin.gif';
                img.style.position = 'absolute';
                img.style.width = scaleSize(90) + 'px';
                img.style.height = 'auto';
                img.style.objectFit = 'contain';
                
                // Position the plugin animation at the center top area
                const centerX = CENTER_X - scaleSize(20);
                const centerY = CENTER_Y - scaleSize(15);
                
                img.style.left = (centerX - scaleSize(22.5)) + 'px';
                img.style.top = (centerY - scaleSize(22.5)) + 'px';
                
                gifContainer.appendChild(img);
                
                let frame = 0;
                const animate = () => {
                    const currentStates = flows[currentFlow];
                    const currentState = currentStates[currentStateIndex];
                    if (currentState.title === "Connect to PC") {
                        currentState.draw(ctx, frame++);
                        requestAnimationFrame(animate);
                    } else {
                        // Cleanup when switching away
                        if (gifContainer.parentNode) {
                            gifContainer.parentNode.removeChild(gifContainer);
                        }
                    }
                };
                animate();
            }
        }
    ],
    // levelling: [
    //     {
    //         title: "Attitude Indicator v4",
    //         explanation: "Device orientation: graphically show the accelerometer data in an intuitive way to enhance and facilitate levelling outside of the app",
    //         draw: (ctx, frame) => {
    //             // Clear the canvas
    //             ctx.fillStyle = '#000';
    //             ctx.fillRect(0, 0, LCD_WIDTH, LCD_HEIGHT);
                
    //             // Save the context state
    //             ctx.save();
                
    //             // Move to center and rotate for roll
    //             const centerX = CENTER_X;
    //             const centerY = CENTER_Y;
    //             ctx.translate(centerX, centerY);
    //             ctx.rotate((rollDegrees * rollExaggerationFactor) * Math.PI / 180);  // Use global roll exaggeration
                
    //             // Draw extended sky (black) - make it larger than the LCD
    //             ctx.fillStyle = '#000000';
    //             ctx.fillRect(-200, -200, 400, 400);
                
    //             // Determine if we're within 1 degree margin
    //             const isLevel = Math.abs(rollDegrees) <= 1 && Math.abs(pitchDegrees) <= 1;
                
    //             // Draw extended ground with color based on level status
    //             ctx.fillStyle = isLevel ? '#00FF00' : '#FF0000';
    //             ctx.fillRect(-200, pitchDegrees * pitchExaggerationFactor, 400, 400);  // Move the ground with pitch
                
    //             // Restore the context
    //             ctx.restore();
                
    //             // Draw the fixed horizon line in white
    //             ctx.strokeStyle = '#FFFFFF';
    //             ctx.lineWidth = scaleSize(3);
    //             ctx.beginPath();
    //             ctx.moveTo(0, CENTER_Y);  // Fixed at center
    //             ctx.lineTo(LCD_WIDTH, CENTER_Y);
    //             ctx.stroke();
                
    //             // Draw the fixed center marker in white
    //             ctx.strokeStyle = '#FFFFFF';
    //             ctx.lineWidth = scaleSize(2);
    //             ctx.beginPath();
    //             ctx.moveTo(scaleX(70), CENTER_Y);  // Fixed at center
    //             ctx.lineTo(scaleX(90), CENTER_Y);
    //             ctx.moveTo(CENTER_X, scaleY(30));
    //             ctx.lineTo(CENTER_X, scaleY(50));
    //             ctx.stroke();
    //         },
    //         led: { state: 'on', color: 'green' },
    //         onEnter: () => {
    //             let frame = 0;
    //             const animate = () => {
    //                 const currentStates = flows[currentFlow];
    //                 const currentState = currentStates[currentStateIndex];
    //                 if (currentState.title === "Attitude Indicator v4") {  // Fixed to check for v4
    //                     // Update LED state based on level status
    //                     const isLevel = Math.abs(rollDegrees) <= 1 && Math.abs(pitchDegrees) <= 1;
    //                     currentState.led = isLevel ? 
    //                         { state: 'on', color: 'green' } : 
    //                         { state: 'blink', color: 'green' };
                            
    //                     currentState.draw(ctx, frame++);
    //                     requestAnimationFrame(animate);
    //                 }
    //             };
    //             animate();
    //         }
    //     },
       
       
    // ],
    ShotState: [
        {
            title: "White ready sequence",
            explanation: "A white loading animation that indicates processing or loading state.",
            draw: (ctx, frame) => {
                // Clear the canvas
                ctx.fillStyle = '#000';
                ctx.fillRect(0, 0, LCD_WIDTH, LCD_HEIGHT);
            },
            led: { state: 'breathing', color: 'red' }, // Initial LED state is always white breathing
            onEnter: () => {
                // Reset LED state to white breathing immediately
                ledLight.className = 'led-light';
                ledLight.classList.add('breathing');
                ledLight.classList.add('red');
                
                // Explicitly set the LED state in the current state
                const currentStates = flows[currentFlow];
                const currentState = currentStates[currentStateIndex];
                currentState.led = { state: 'breathing', color: 'red' };
                
                // Create a container for the GIF/PNG
                const gifContainer = document.createElement('div');
                gifContainer.style.position = 'absolute';
                gifContainer.style.top = 0 + 'px';
                gifContainer.style.left = 0 + 'px';
                gifContainer.style.width = canvas.width + 'px';
                gifContainer.style.height = canvas.height + 'px';
                gifContainer.style.zIndex = '0';
                gifContainer.dataset.gifContainer = 'true'; // Add data attribute for easy selection
                canvas.parentNode.appendChild(gifContainer);

                // Create and load the image
                const img = document.createElement('img');
                img.style.width = '100%';
                img.style.height = '100%';
                img.style.objectFit = 'contain';
                gifContainer.appendChild(img);

    

                // Start the sequence with white loading
                img.src = 'Assets/Main Gif/Loading.gif';
                
                let frame = 0;
                let sequenceStage = 0; // 0: Loading, 1: Ready animation, 2: Ready static
                let startTime = Date.now();
                
                const animate = () => {
                    const currentStates = flows[currentFlow];
                    const currentState = currentStates[currentStateIndex];
                    if (currentState.title === "White ready sequence") {
                        // Calculate elapsed time in milliseconds
                        const elapsedTime = Date.now() - startTime;
                        
                        // State transitions based on time
                        if (sequenceStage === 0 && elapsedTime >= secondsToFrames(4) * (1000/FRAME_RATE)) {
                            // After loading animation completes, go directly to place ball state
                            // Clean up the GIF container
                            if (gifContainer.parentNode) {
                                gifContainer.parentNode.removeChild(gifContainer);
                            }
                            
                            // Reset shot in progress and go to place ball state
                            isShotInProgress = false;
                            ballCount = 0;
                            updateBallState();
                            return; // Stop the animation
                        }
                        
                                currentState.draw(ctx, frame++);
                                requestAnimationFrame(animate);
                    } else {
                        // Cleanup when switching away
                        if (gifContainer.parentNode) {
                            gifContainer.parentNode.removeChild(gifContainer);
                        }
                    }
                };
                animate();
                
                // Return a cleanup function
                return {
                    destroy: () => {
                        if (gifContainer.parentNode) {
                            gifContainer.parentNode.removeChild(gifContainer);
                        }
                    }
                };
            }
        },
    
    ],
    ShotState2: [
        {
            title: "White ready sequence",
            explanation: "A white loading animation that indicates processing or loading state.",
            draw: (ctx, frame) => {
                // Clear the canvas
                ctx.fillStyle = '#000';
                ctx.fillRect(0, 0, LCD_WIDTH, LCD_HEIGHT);
            },
            led: { state: 'breathing', color: 'red' }, // Initial LED state is always white breathing
            onEnter: () => {
                // Reset LED state to white breathing immediately
                ledLight.className = 'led-light';
                ledLight.classList.add('breathing');
                ledLight.classList.add('red');
                
                // Explicitly set the LED state in the current state
                const currentStates = flows[currentFlow];
                const currentState = currentStates[currentStateIndex];
                currentState.led = { state: 'breathing', color: 'red' };
                
                // Create a container for the GIF/PNG
                const gifContainer = document.createElement('div');
                gifContainer.style.position = 'absolute';
                gifContainer.style.top = 0 + 'px';
                gifContainer.style.left = 0 + 'px';
                gifContainer.style.width = canvas.width + 'px';
                gifContainer.style.height = canvas.height + 'px';
                gifContainer.style.zIndex = '0';
                gifContainer.dataset.gifContainer = 'true'; // Add data attribute for easy selection
                canvas.parentNode.appendChild(gifContainer);

                // Create and load the image
                const img = document.createElement('img');
                img.style.width = '100%';
                img.style.height = '100%';
                img.style.objectFit = 'contain';
                gifContainer.appendChild(img);



                // Start the sequence with white loading
                img.src = 'Assets/Main Gif/Loading.gif';
                
                let frame = 0;
                let sequenceStage = 0; // 0: Loading, 1: Ready animation, 2: Ready static
                let startTime = Date.now();
                
                const animate = () => {
                    const currentStates = flows[currentFlow];
                    const currentState = currentStates[currentStateIndex];
                    if (currentState.title === "White ready sequence") {
                        // Calculate elapsed time in milliseconds
                        const elapsedTime = Date.now() - startTime;
                        
                        // State transitions based on time
                        if (sequenceStage === 0 && elapsedTime >= secondsToFrames(4) * (1000/FRAME_RATE)) {
                            // After loading animation completes, go directly to place ball state
                            // Clean up the GIF container
                            if (gifContainer.parentNode) {
                                gifContainer.parentNode.removeChild(gifContainer);
                            }
                            
                            // Reset shot in progress and go to place ball state
                            isShotInProgress = false;
                            ballCount = 0;
                            updateBallState();
                            return; // Stop the animation
                        }
                        
                        currentState.draw(ctx, frame++);
                        requestAnimationFrame(animate);
                    } else {
                        // Cleanup when switching away
                        if (gifContainer.parentNode) {
                            gifContainer.parentNode.removeChild(gifContainer);
                        }
                    }
                };
                animate();
                
                // Return a cleanup function
                return {
                    destroy: () => {
                        if (gifContainer.parentNode) {
                            gifContainer.parentNode.removeChild(gifContainer);
                        }
                    }
                };
            }
        },
       
    ],
    "Connection Animations": [
        {
            title: "Connection Sequence",
            explanation: "Device connection sequence with 3-symbol animation (device, computer, globe) and minimizing to tray.",
            draw: (ctx, frame) => {
                ctx.fillStyle = '#000';
                ctx.fillRect(0, 0, LCD_WIDTH, LCD_HEIGHT);
                
                // Calculate transition progress
                const transitionStart = 540; // When connection is established + 1 second pause (9 seconds total)
                const transitionDuration = 60; // 1 second transition
                const transitionProgress = Math.min(1, Math.max(0, (frame - transitionStart) / transitionDuration));
                
                // Draw new 3-symbol connection sequence with minimizing animation
                if (connectionState === 'connected' && frame >= transitionStart && transitionProgress < 1) {
                    // Calculate positions for minimizing animation
                    const startSize = scaleSize(15);
                    const endSize = TRAY_POSITION.size;
                    
                    // Center positions (accounting for size)
                    const startX = CENTER_X - startSize/2;  // Center of screen
                    const startY = CENTER_Y - startSize/2;  // Center of screen
                    const endX = TRAY_POSITION.x - endSize/2;     // Tray position
                    const endY = TRAY_POSITION.y - endSize/2;     // Tray position
                    
                    // Interpolate position and size
                    const currentSize = startSize + (endSize - startSize) * transitionProgress;
                    const currentX = startX + (endX - startX) * transitionProgress;
                    const currentY = startY + (endY - startY) * transitionProgress;
                    
                    // Draw the minimizing animation
                    ctx.save();
                    ctx.translate(currentX, currentY);
                    ctx.scale(currentSize/startSize, currentSize/startSize);
                    
                    // Draw minimized connection sequence
                    drawMinimizedConnectionSequence(ctx, frame, transitionProgress);
                    ctx.restore();
                        } else {
                    // Draw full size connection sequence
                    drawConnectionSequence(ctx, frame, connectionState);
                }

                // Draw subtle status text
                ctx.globalAlpha = 0.5;
                ctx.fillStyle = '#fff'; // White text
                ctx.font = scaleSize(10) + 'px monospace';
                ctx.textAlign = 'left';
                
                if (connectionState !== 'connected' || (frame < transitionStart) || transitionProgress < 1) {
                    // Full height mode text
                    const textOpacity = connectionState === 'connected' ? (frame < transitionStart ? 0.4 : 1 - transitionProgress) : 0.4;
                    ctx.globalAlpha = textOpacity;
                    
                    switch(connectionState) {
                        case 'searching':
                            ctx.fillText('Connecting to Device', scaleX(10), scaleY(15));
                            break;
                        case 'connecting':
                            ctx.fillText('Connecting to Internet', scaleX(10), scaleY(15));
                            break;
                        case 'connected':
                            ctx.fillText('Connected', scaleX(10), scaleY(15));
                            break;
                    }
                } else {
                    // Tray mode - no text needed
                }
                ctx.globalAlpha = 1;
            },
            led: { state: 'breathing', color: 'blue' },
            onEnter: () => {
                let frame = 0;
                connectionState = 'searching';
                
                const animate = () => {
                    const currentStates = flows[currentFlow];
                    const currentState = currentStates[currentStateIndex];
                                        if (currentState.title === "Connection Sequence") {
                        currentState.draw(ctx, frame++);
                        
                        // Update LED state based on connection state and frame
                        if (connectionState === 'searching' || connectionState === 'connecting') {
                            currentState.led = { state: 'breathing', color: 'blue' };
                        } else if (connectionState === 'connected') {
                            if (frame >= 600) { // Wait for transition to complete (10 seconds total - 1 second pause + 1 second transition)
                                // Keep connected state for 5 seconds then minimize to tray
                                if (frame >= 900) { // 15 seconds total (10s animation + 5s hold)
                                    // Transition to minimized tray state
                                    currentStateIndex = 1; // Move to next state (minimized tray)
                            updateDisplay();
                                    return;
                        } else {
                                    currentState.led = { state: 'on', color: 'green' };
                        }
                    } else {
                                currentState.led = { state: 'on', color: 'green' };
                            }
                        }
                        
                        // Update the LED display
                        ledLight.className = 'led-light';
                        ledLight.classList.add(currentState.led.state);
                        ledLight.classList.add(currentState.led.color);
                        if (currentState.led.state === 'on') {
                            ledLight.classList.add('on');
                        }
                        
                        // Simulate connection process with new 3-step sequence
                        if (frame === 180) { // After 3 seconds - device connects to WiFi
                            connectionState = 'connecting';
                        } else if (frame === 420) { // After 7 seconds - WiFi connects to internet
                            connectionState = 'connected';
                            // Play success sound when connection is established
                            const successSound = new Audio('Assets/game sounds/success3.mp3');
                            successSound.volume = 0.5;
                            successSound.play().catch(e => console.log('Audio play failed:', e));
                        }
                        
                        requestAnimationFrame(animate);
                    }
                };
                animate();
            }
        },
        {
            title: "Failed Connection Sequence",
            explanation: "Device connection sequence that fails when trying to connect to computer. Pulsing dot turns to red cross.",
            draw: (ctx, frame) => {
                ctx.fillStyle = '#000';
                ctx.fillRect(0, 0, LCD_WIDTH, LCD_HEIGHT);
                
                // Draw the 3-symbol connection sequence with failure state
                drawConnectionSequence(ctx, frame, connectionState);

                // Draw subtle status text
                ctx.globalAlpha = 0.5;
                ctx.fillStyle = '#fff'; // White text
                ctx.font = scaleSize(10) + 'px monospace';
                ctx.textAlign = 'left';
                
                switch(connectionState) {
                    case 'searching':
                        ctx.fillText('Connecting to Device', scaleX(10), scaleY(15));
                        break;
                    case 'failed':
                        ctx.fillText('Connection Failed', scaleX(10), scaleY(15));
                        break;
                }
                ctx.globalAlpha = 1;
            },
            led: { state: 'breathing', color: 'red' },
            onEnter: () => {
                let frame = 0;
                connectionState = 'searching';
                
                const animate = () => {
                    const currentStates = flows[currentFlow];
                    const currentState = currentStates[currentStateIndex];
                    if (currentState.title === "Failed Connection Sequence") {
                        currentState.draw(ctx, frame++);
                        
                        // Update LED state based on connection state
                        if (connectionState === 'searching') {
                            currentState.led = { state: 'breathing', color: 'blue' };
                        } else if (connectionState === 'failed') {
                            currentState.led = { state: 'breathing', color: 'red' };
                        }
                        
                        // Update the LED display
                        ledLight.className = 'led-light';
                        ledLight.classList.add(currentState.led.state);
                        ledLight.classList.add(currentState.led.color);
                        if (currentState.led.state === 'on') {
                            ledLight.classList.add('on');
                        }
                        
                        // Simulate connection failure after 3 seconds
                        if (frame === 180) { // After 3 seconds - connection fails
                            connectionState = 'failed';
                            // Play error sound when connection fails
                            const errorSound1 = new Audio('Assets/game sounds/neg3.mp3');
                            errorSound1.volume = 0.5;
                            errorSound1.play().catch(e => console.log('Audio play failed:', e));
                        }
                        
                        // Keep failed state for 5 seconds then minimize to tray
                        if (frame >= 480) { // 8 seconds total (3s searching + 5s failure)
                            // Transition to minimized tray state
                            currentStateIndex = 2; // Move to minimized tray failure state
                            updateDisplay();
                            return;
                        }
                        
                        requestAnimationFrame(animate);
                    }
                };
                animate();
            }
        },
        {
            title: "Internet Connection Failed",
            explanation: "Device connection sequence that succeeds to computer but fails when connecting to internet. First tick is green, second becomes red cross.",
            draw: (ctx, frame) => {
                ctx.fillStyle = '#000';
                ctx.fillRect(0, 0, LCD_WIDTH, LCD_HEIGHT);

                // Draw the 3-symbol connection sequence with partial failure state
                drawConnectionSequence(ctx, frame, connectionState);

                // Draw subtle status text
                ctx.globalAlpha = 0.5;
                ctx.fillStyle = '#fff'; // White text
                ctx.font = scaleSize(10) + 'px monospace';
                ctx.textAlign = 'left';
                
                switch(connectionState) {
                    case 'searching':
                        ctx.fillText('Connecting to Device', scaleX(10), scaleY(15));
                        break;
                    case 'connecting':
                        ctx.fillText('Connecting to Internet', scaleX(10), scaleY(15));
                        break;
                    case 'internet_failed':
                        ctx.fillText('Internet Connection Failed', scaleX(10), scaleY(15));
                        break;
                }
                ctx.globalAlpha = 1;
            },
            led: { state: 'breathing', color: 'red' },
            onEnter: () => {
                let frame = 0;
                connectionState = 'searching';
                
                const animate = () => {
                    const currentStates = flows[currentFlow];
                    const currentState = currentStates[currentStateIndex];
                    if (currentState.title === "Internet Connection Failed") {
                        currentState.draw(ctx, frame++);
                        
                        // Update LED state based on connection state
                        if (connectionState === 'searching') {
                            currentState.led = { state: 'breathing', color: 'blue' };
                        } else if (connectionState === 'connecting') {
                            currentState.led = { state: 'breathing', color: 'blue' };
                        } else if (connectionState === 'internet_failed') {
                            currentState.led = { state: 'breathing', color: 'red' };
                        }
                        
                        // Update the LED display
                        ledLight.className = 'led-light';
                        ledLight.classList.add(currentState.led.state);
                        ledLight.classList.add(currentState.led.color);
                        if (currentState.led.state === 'on') {
                            ledLight.classList.add('on');
                        }
                        
                        // Simulate connection process with internet failure
                        if (frame === 180) { // After 3 seconds - device connects to computer successfully
                            connectionState = 'connecting';
                        } else if (frame === 420) { // After 7 seconds - internet connection fails
                            connectionState = 'internet_failed';
                            // Play error sound when internet connection fails
                            const errorSound1 = new Audio('Assets/game sounds/neg3.mp3');
                            errorSound1.volume = 0.5;
                            errorSound1.play().catch(e => console.log('Audio play failed:', e));
                        }
                        
                        // Keep failed state for 5 seconds then minimize to tray
                        if (frame >= 480) { // 8 seconds total (3s searching + 2s connecting + 3s failure)
                            // Transition to minimized tray state
                            currentStateIndex = 3; // Move to minimized tray failure state
                            updateDisplay();
                            return;
                        }
                        
                        requestAnimationFrame(animate);
                    }
                };
                animate();
            }
        },
        
    ],
    "Connection Animations 2": [
        {
            title: "Device to Computer",
            explanation: "Step 1: Device connecting to computer with full width display.",
            draw: (ctx, frame) => {
                ctx.fillStyle = '#000';
                ctx.fillRect(0, 0, LCD_WIDTH, LCD_HEIGHT);
                
                // Draw only device and computer symbols with full width spacing
                const centerY = CENTER_Y;
                const symbolSize = scaleSize(35); // Larger symbols for better visibility
                const deviceX = scaleX(30);  // Left position (framed within LCD width)
                const computerX = scaleX(140); // Right position (framed within LCD width)
                
                // Draw custom SVG symbols
                const drawSymbol = (whiteImg, greenImg, x, y, size, isGreen = false) => {
                    const img = isGreen ? greenImg : whiteImg;
                    if (img && img.complete) {
                        const scale = size / Math.max(img.width, img.height);
                        const drawWidth = img.width * scale;
                        const drawHeight = img.height * scale;
                        const drawX = x - drawWidth / 2;
                        const drawY = y - drawHeight / 2;
                        
                        ctx.save();
                        ctx.globalCompositeOperation = 'source-over';
                        ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
                        ctx.restore();
                    }
                };
                
                // Draw device symbol (larger)
                drawSymbol(deviceImg, deviceImgGreen, deviceX, centerY, symbolSize * 1.5, true); // Always green
                
                // Draw computer symbol (normal size)
                drawSymbol(wifiImg, wifiImgGreen, computerX, centerY, symbolSize, connectionState === 'connected');
                
                // Draw animated dot or checkmark between symbols
                const dotX = (deviceX + computerX) / 2;
                const dotSize = scaleSize(3); // Smaller dots
                
                                if (connectionState === 'searching') {
                    // Note: Dot animation will be handled by DOM overlay in onEnter
                } else if (connectionState === 'connected') {
                    // Success tick is now handled by DOM overlay in onEnter
                }

                // Draw status text
                ctx.globalAlpha = 0.7;
                    ctx.fillStyle = '#fff';
                ctx.font = scaleSize(14) + 'px monospace';
                ctx.textAlign = 'center';
                
                if (connectionState === 'searching') {
                    ctx.fillText('Connecting to Computer', CENTER_X, scaleY(200));
                } else if (connectionState === 'connected') {
                    ctx.fillText('Computer Connected', CENTER_X, scaleY(200));
                }
                ctx.globalAlpha = 1;
            },
            led: { state: 'breathing', color: 'blue' },
            onEnter: () => {
                let frame = 0;
                connectionState = 'searching';
                
                // Create DOM overlay for dot animation GIF
                const dotAnimationContainer = document.createElement('div');
                dotAnimationContainer.style.position = 'absolute';
                dotAnimationContainer.style.top = '0px';
                dotAnimationContainer.style.left = '0px';
                dotAnimationContainer.style.width = canvas.width + 'px';
                dotAnimationContainer.style.height = canvas.height + 'px';
                dotAnimationContainer.style.zIndex = '5';
                dotAnimationContainer.style.pointerEvents = 'none';
                canvas.parentNode.appendChild(dotAnimationContainer);
                
                // Create and position the dot animation GIF
                const dotAnimationImg = document.createElement('img');
                dotAnimationImg.src = 'Assets/Reference/dot animation.gif';
                dotAnimationImg.style.position = 'absolute';
                dotAnimationImg.style.width = scaleSize(30) + 'px';
                dotAnimationImg.style.height = 'auto';
                dotAnimationImg.style.objectFit = 'contain';
                
                                            // Position between device and computer symbols
                            const deviceX = scaleX(30);
                            const computerX = scaleX(140);
                            const centerX = (deviceX + computerX) / 2;
                            const centerY = CENTER_Y;
                            
                            dotAnimationImg.style.left = (centerX - scaleSize(15)) + 'px';
                            dotAnimationImg.style.top = (centerY - scaleSize(5)) + 'px';
                
                dotAnimationContainer.appendChild(dotAnimationImg);
                
                const animate = () => {
                    const currentStates = flows[currentFlow];
                    const currentState = currentStates[currentStateIndex];
                    if (currentState.title === "Device to Computer") {
                        currentState.draw(ctx, frame++);
                        
                        // Update LED state based on connection state
                        if (connectionState === 'searching') {
                            currentState.led = { state: 'breathing', color: 'blue' };
                        } else if (connectionState === 'connected') {
                            currentState.led = { state: 'breathing', color: 'blue' }; // Keep blue until computer to globe connection
                        }
                        
                        // Update the LED display
                        ledLight.className = 'led-light';
                        ledLight.classList.add(currentState.led.state);
                        ledLight.classList.add(currentState.led.color);
                        if (currentState.led.state === 'on') {
                            ledLight.classList.add('on');
                        }
                        
                        // Simulate connection to computer after 3 seconds
                        if (frame === 180) { // After 3 seconds
                            connectionState = 'connected';
                            console.log('Connection successful, creating success animation');
                            // Replace dot animation with success tick
                            if (dotAnimationContainer.parentNode) {
                                dotAnimationContainer.parentNode.removeChild(dotAnimationContainer);
                            }
                            
                            // Create success tick animation
                            const successTickContainer = document.createElement('div');
                            successTickContainer.style.position = 'absolute';
                            successTickContainer.style.top = '0px';
                            successTickContainer.style.left = '0px';
                            successTickContainer.style.width = canvas.width + 'px';
                            successTickContainer.style.height = canvas.height + 'px';
                            successTickContainer.style.zIndex = '5';
                            successTickContainer.style.pointerEvents = 'none';
                            canvas.parentNode.appendChild(successTickContainer);
                            
                            const successTickImg = document.createElement('img');
                            successTickImg.src = 'Assets/Reference/success.gif';
                            successTickImg.style.position = 'absolute';
                            successTickImg.style.width = scaleSize(20) + 'px';
                            successTickImg.style.height = 'auto';
                            successTickImg.style.objectFit = 'contain';
                            
                            // Position between device and computer symbols
                            const deviceX = scaleX(30);
                            const computerX = scaleX(140);
                            const centerX = (deviceX + computerX) / 2;
                            const centerY = CENTER_Y;
                            
                            successTickImg.style.left = (centerX - scaleSize(10)) + 'px';
                            successTickImg.style.top = (centerY - scaleSize(10)) + 'px';
                            
                            successTickContainer.appendChild(successTickImg);
                            
                            // Let GIF play completely, then show final frame for 0.5 seconds
                            let gifCompleted = false;
                            let finalFrameShown = false;
                            
                            // Listen for GIF load to estimate duration
                            successTickImg.onload = () => {
                                console.log('Success GIF loaded, starting animation');
                                // Estimate GIF duration (most success GIFs are ~1-2 seconds)
                                const estimatedDuration = 1500; // 1.5 seconds
                                
                                setTimeout(() => {
                                    gifCompleted = true;
                                    console.log('Replacing GIF with PNG');
                                    // Replace GIF with final frame PNG
                                    successTickImg.src = 'Assets/Reference/success.png';
                                    
                                    // Show final frame for 0.5 seconds, then remove container
                                    setTimeout(() => {
                                        if (successTickContainer.parentNode && !finalFrameShown) {
                                            finalFrameShown = true;
                                            console.log('Removing success container');
                                            successTickContainer.parentNode.removeChild(successTickContainer);
                                        }
                                    }, 500);
                                }, estimatedDuration);
                            };
                            
                            // Ensure the image starts with the GIF, not the PNG
                            successTickImg.onerror = () => {
                                console.error('Failed to load success GIF');
                            };
                            
                            // No success sound until total connection is complete
                        }
                        
                        // Keep connected state for 2 seconds then transition to next step
                        if (frame >= 300) { // 5 seconds total (3s connecting + 2s hold)
                            // Clean up dot animation container
                            if (dotAnimationContainer.parentNode) {
                                dotAnimationContainer.parentNode.removeChild(dotAnimationContainer);
                            }
                            currentStateIndex = 1; // Move to computer to internet step
                            updateDisplay();
                            return;
                        }
                        
                        requestAnimationFrame(animate);
                    } else {
                        // Clean up when switching away
                        if (dotAnimationContainer.parentNode) {
                            dotAnimationContainer.parentNode.removeChild(dotAnimationContainer);
                        }
                    }
                };
                animate();
            }
        },
        {
            title: "Computer to Internet",
            explanation: "Step 2: Computer connecting to internet with fade-in animation.",
            draw: (ctx, frame) => {
                ctx.fillStyle = '#000';
                ctx.fillRect(0, 0, LCD_WIDTH, LCD_HEIGHT);
                
                // Calculate fade-in progress for the globe
                const fadeInDuration = 60; // 1 second fade-in
                const fadeProgress = Math.min(1, frame / fadeInDuration);
                
                const centerY = CENTER_Y;
                const symbolSize = scaleSize(35);
                const computerX = scaleX(20);  // Left position (computer) - framed within LCD width
                const globeX = scaleX(135);    // Right position (globe) - framed within LCD width
                
                // Draw custom SVG symbols
                const drawSymbol = (whiteImg, greenImg, x, y, size, isGreen = false, opacity = 1) => {
                    const img = isGreen ? greenImg : whiteImg;
                    if (img && img.complete) {
                        const scale = size / Math.max(img.width, img.height);
                        const drawWidth = img.width * scale;
                        const drawHeight = img.height * scale;
                        const drawX = x - drawWidth / 2;
                        const drawY = y - drawHeight / 2;
                        
                ctx.save();
                        ctx.globalAlpha = opacity;
                        ctx.globalCompositeOperation = 'source-over';
                        ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
                ctx.restore();
                    }
                };
                
                // Draw computer symbol (green, always visible)
                drawSymbol(wifiImg, wifiImgGreen, computerX, centerY, symbolSize, true);
                
                // Draw globe symbol with fade-in effect
                drawSymbol(globeImg, globeImgGreen, globeX, centerY, symbolSize, connectionState === 'connected', fadeProgress);
                
                // Draw animated dot or checkmark between symbols
                const dotX = (computerX + globeX) / 2;
                const dotSize = scaleSize(3); // Smaller dots
                
                                if (connectionState === 'searching') {
                    // Note: Dot animation will be handled by DOM overlay in onEnter
                                } else if (connectionState === 'connected') {
                    // Success tick is now handled by DOM overlay in onEnter
                }

                // Draw status text with fade-in
                ctx.globalAlpha = 0.7 * fadeProgress;
                    ctx.fillStyle = '#fff';
                ctx.font = scaleSize(14) + 'px monospace';
                ctx.textAlign = 'center';
                
                if (connectionState === 'searching') {
                    ctx.fillText('Connecting to Internet', CENTER_X, scaleY(200));
                } else if (connectionState === 'connected') {
                    ctx.fillText('Internet Connected', CENTER_X, scaleY(200));
                }
                ctx.globalAlpha = 1;
            },
            led: { state: 'breathing', color: 'blue' },
            onEnter: () => {
                let frame = 0;
                connectionState = 'searching';
                
                // Create DOM overlay for dot animation GIF with fade-in effect
                const dotAnimationContainer = document.createElement('div');
                dotAnimationContainer.style.position = 'absolute';
                dotAnimationContainer.style.top = '0px';
                dotAnimationContainer.style.left = '0px';
                dotAnimationContainer.style.width = canvas.width + 'px';
                dotAnimationContainer.style.height = canvas.height + 'px';
                dotAnimationContainer.style.zIndex = '5';
                dotAnimationContainer.style.pointerEvents = 'none';
                dotAnimationContainer.style.opacity = '0'; // Start invisible for fade-in
                canvas.parentNode.appendChild(dotAnimationContainer);
                
                // Create and position the dot animation GIF
                const dotAnimationImg = document.createElement('img');
                dotAnimationImg.src = 'Assets/Reference/dot animation.gif';
                dotAnimationImg.style.position = 'absolute';
                dotAnimationImg.style.width = scaleSize(30) + 'px';
                dotAnimationImg.style.height = 'auto';
                dotAnimationImg.style.objectFit = 'contain';
                
                                            // Position between computer and globe symbols
                            const computerX = scaleX(20);
                            const globeX = scaleX(135);
                            const centerX = (computerX + globeX) / 2;
                            const centerY = CENTER_Y;
                            
                            dotAnimationImg.style.left = (centerX - scaleSize(15)) + 'px';
                            dotAnimationImg.style.top = (centerY - scaleSize(5)) + 'px';
                
                dotAnimationContainer.appendChild(dotAnimationImg);
                
                const animate = () => {
                    const currentStates = flows[currentFlow];
                    const currentState = currentStates[currentStateIndex];
                    if (currentState.title === "Computer to Internet") {
                        currentState.draw(ctx, frame++);
                        
                        // Update LED state based on connection state
                        if (connectionState === 'searching' || connectionState === 'connecting') {
                            currentState.led = { state: 'breathing', color: 'blue' };
                        } else if (connectionState === 'connected') {
                            currentState.led = { state: 'breathing', color: 'blue' }; // Keep blue until final connection
                        }
                        
                        // Update the LED display
                        ledLight.className = 'led-light';
                        ledLight.classList.add(currentState.led.state);
                        ledLight.classList.add(currentState.led.color);
                        if (currentState.led.state === 'on') {
                            ledLight.classList.add('on');
                        }
                        
                        // Fade in dot animation over 1 second (60 frames)
                        if (frame <= 60) {
                            const fadeProgress = frame / 60;
                            dotAnimationContainer.style.opacity = fadeProgress;
                        }
                        
                        // Simulate connection to internet after 3 seconds (plus 1s fade-in)
                        if (frame === 240) { // After 4 seconds (1s fade + 3s connecting)
                            connectionState = 'connected';
                            // Replace dot animation with success tick
                            if (dotAnimationContainer.parentNode) {
                                dotAnimationContainer.parentNode.removeChild(dotAnimationContainer);
                            }
                            
                            // Create success tick animation
                            const successTickContainer = document.createElement('div');
                            successTickContainer.style.position = 'absolute';
                            successTickContainer.style.top = '0px';
                            successTickContainer.style.left = '0px';
                            successTickContainer.style.width = canvas.width + 'px';
                            successTickContainer.style.height = canvas.height + 'px';
                            successTickContainer.style.zIndex = '5';
                            successTickContainer.style.pointerEvents = 'none';
                            canvas.parentNode.appendChild(successTickContainer);
                            
                            const successTickImg = document.createElement('img');
                            successTickImg.src = 'Assets/Reference/success.gif';
                            successTickImg.style.position = 'absolute';
                            successTickImg.style.width = scaleSize(20) + 'px';
                            successTickImg.style.height = 'auto';
                            successTickImg.style.objectFit = 'contain';
                            
                            // Position between computer and globe symbols
                            const computerX = scaleX(20);
                            const globeX = scaleX(135);
                            const centerX = (computerX + globeX) / 2;
                            const centerY = CENTER_Y;
                            
                            successTickImg.style.left = (centerX - scaleSize(10)) + 'px';
                            successTickImg.style.top = (centerY - scaleSize(10)) + 'px';
                            
                            successTickContainer.appendChild(successTickImg);
                            
                            // Let GIF play completely, then show final frame for 0.5 seconds
                            let gifCompleted = false;
                            let finalFrameShown = false;
                            
                            // Listen for GIF load to estimate duration
                            successTickImg.onload = () => {
                                // Estimate GIF duration (most success GIFs are ~1-2 seconds)
                                const estimatedDuration = 1500; // 1.5 seconds
                                
                                setTimeout(() => {
                                    gifCompleted = true;
                                    // Replace GIF with final frame PNG
                                    successTickImg.src = 'Assets/Reference/success.png';
                                    
                                    // Show final frame for 0.5 seconds, then scale down and minimize
                                    setTimeout(() => {
                                        if (successTickContainer.parentNode && !finalFrameShown) {
                                            finalFrameShown = true;
                                            
                                            // Scale down and minimize to top right
                                            const minimizeDuration = 1000; // 1 second animation
                                            const startTime = Date.now();
                                            
                                            const animateMinimize = () => {
                                                const elapsed = Date.now() - startTime;
                                                const progress = Math.min(1, elapsed / minimizeDuration);
                                                
                                                // Calculate final position (top right corner)
                                                const finalSize = scaleSize(12); // Smaller size
                                                const finalX = canvas.width - finalSize - 10; // 10px from right edge
                                                const finalY = 50; // 10px from top
                                                
                                                // Interpolate between current position and final position
                                                const currentSize = scaleSize(20);
                                                const currentX = centerX - scaleSize(10);
                                                const currentY = centerY - scaleSize(10);
                                                
                                                const newSize = currentSize + (finalSize - currentSize) * progress;
                                                const newX = currentX + (finalX - currentX) * progress;
                                                const newY = currentY + (finalY - currentY) * progress;
                                                
                                                successTickImg.style.width = newSize + 'px';
                                                successTickImg.style.left = newX + 'px';
                                                successTickImg.style.top = newY + 'px';
                                                
                                                if (progress < 1) {
                                                    requestAnimationFrame(animateMinimize);
                                                } else {
                                                    // Change to Linked Green.png when reaching final position
                                                    successTickImg.src = 'Assets/Reference/Linked Green.png';
                                                    // Keep minimized icon visible - now persistent
                                                    // Don't remove the container
                                                }
                                            };
                                            
                                            animateMinimize();
                                        }
                                    }, 500);
                                }, estimatedDuration);
                            };
                            
                            // Play success sound only when total connection is complete
                            const successSound = new Audio('Assets/game sounds/success3.mp3');
                            successSound.volume = 0.5;
                            successSound.play().catch(e => console.log('Audio play failed:', e));
                        }
                        
                        // Keep connected state for 2 seconds then minimize to tray
                        if (frame >= 360) { // 6 seconds total (1s fade + 3s connecting + 2s hold)
                            // Clean up dot animation container
                            if (dotAnimationContainer.parentNode) {
                                dotAnimationContainer.parentNode.removeChild(dotAnimationContainer);
                            }
                            currentStateIndex = 2; // Move to minimized tray
                            updateDisplay();
                            return;
                        }
                        
                        requestAnimationFrame(animate);
                    } else {
                        // Clean up when switching away
                        if (dotAnimationContainer.parentNode) {
                            dotAnimationContainer.parentNode.removeChild(dotAnimationContainer);
                        }
                    }
                };
                animate();
            }
        },
        
    ],
   
    
    
};

// Initialize canvas
const canvas = document.getElementById('lcdCanvas');
const ctx = canvas.getContext('2d');

// Set canvas text rendering quality
ctx.imageSmoothingEnabled = true;
ctx.imageSmoothingQuality = 'high';
ctx.textBaseline = 'alphabetic';
let currentStateIndex = 0;
let currentFlow = 'power'; // Set initial flow to power
let currentAnimation = null;

// Navigation elements
const prevButton = document.getElementById('prevStep');
const nextButton = document.getElementById('nextStep');
const explanationText = document.getElementById('stepExplanation');
const currentStepSpan = document.getElementById('currentStep');
const totalStepsSpan = document.getElementById('totalSteps');
const flowSelect = document.getElementById('flowSelect');
const ledLight = document.getElementById('ledLight');

// Add these variables at the top with other state variables
let powerButtonPressStartTime = 0;
let isPowerButtonPressed = false;
const SHUTDOWN_HOLD_TIME = 3300; // 5 seconds in milliseconds
let showSerialNumber = false;
let connectionState = 'searching';

// Add at the top, after other state variables
const microQRImg = new Image();
microQRImg.src = 'Assets/qr.svg';
let microQRImgLoaded = false;
microQRImg.onload = function() { microQRImgLoaded = true; updateDisplay(); };

// Add these variables at the top with other state variables
let rollDegrees = 0;
let pitchDegrees = 0;
let isJoystickActive = false;
let rollExaggerationFactor = 3;  // Global control for roll exaggeration
let pitchExaggerationFactor = 6;  // Global control for pitch exaggeration

// Add the attitude indicator drawing function
function drawAttitudeIndicator(ctx, roll, pitch) {
    // Constants for the attitude indicator
    const centerX = 80;
    const centerY = 40;
    const width = 120;
    const height = 60;
    
    // Save the context state
    ctx.save();
    
    // Move to center and rotate for roll
    ctx.translate(centerX, centerY);
    ctx.rotate(roll * Math.PI / 180);
    
    // Draw the sky (blue)
    ctx.fillStyle = '#1E90FF';
    ctx.fillRect(-width/2, -height/2, width, height/2);
    
    // Draw the ground (brown)
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(-width/2, 0, width, height/2);
    
    // Draw the horizon line
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-width/2, pitch);
    ctx.lineTo(width/2, pitch);
    ctx.stroke();
    
    // Draw the center marker
    ctx.beginPath();
    ctx.moveTo(-10, pitch);
    ctx.lineTo(10, pitch);
    ctx.moveTo(0, pitch - 10);
    ctx.lineTo(0, pitch + 10);
    ctx.stroke();
    
    // Restore the context
    ctx.restore();
}

// Add joystick control functions
function initJoystick() {
    const joystickContainer = document.createElement('div');
    joystickContainer.className = 'joystick-container';
    joystickContainer.innerHTML = `
        <div class="joystick-base">
            <div class="joystick-stick"></div>
        </div>
        <div class="joystick-labels">
            <span class="roll-label">Roll: 0°</span>
            <span class="pitch-label">Pitch: 0°</span>
        </div>
    `;
    
    document.querySelector('.panel-content').appendChild(joystickContainer);
    
    const stick = joystickContainer.querySelector('.joystick-stick');
    const base = joystickContainer.querySelector('.joystick-base');
    const rollLabel = joystickContainer.querySelector('.roll-label');
    const pitchLabel = joystickContainer.querySelector('.pitch-label');
    
    let isDragging = false;
    let startX, startY;
    let baseRect;
    
    function updateJoystick(e) {
        if (!isDragging) return;
        
        const x = e.clientX || e.touches[0].clientX;
        const y = e.clientY || e.touches[0].clientY;
        
        // Calculate position relative to base center
        const centerX = baseRect.left + baseRect.width / 2;
        const centerY = baseRect.top + baseRect.height / 2;
        
        // Calculate distance from center (limited to base radius)
        const maxDistance = baseRect.width / 2;
        const deltaX = x - centerX;
        const deltaY = y - centerY;
        const distance = Math.min(Math.sqrt(deltaX * deltaX + deltaY * deltaY), maxDistance);
        
        // Calculate angle and position
        const angle = Math.atan2(deltaY, deltaX);
        const stickX = Math.cos(angle) * distance;
        const stickY = Math.sin(angle) * distance;
        
        // Update stick position
        stick.style.transform = `translate(${stickX}px, ${stickY}px)`;
        
        // Update degrees with reduced sensitivity
        rollDegrees = (stickX / maxDistance) * 10; // Max 10 degrees roll
        pitchDegrees = (stickY / maxDistance) * 10; // Max 10 degrees pitch
        
        // Update labels
        rollLabel.textContent = `Roll: ${Math.round(rollDegrees)}°`;
        pitchLabel.textContent = `Pitch: ${Math.round(pitchDegrees)}°`;
        
        // Update explanation text
        const explanationText = document.getElementById('stepExplanation');
        if (explanationText) {
            explanationText.textContent = `Device orientation: Roll: ${Math.round(rollDegrees)}° Pitch: ${Math.round(pitchDegrees)}°`;
        }
        
        // Force redraw
        updateDisplay();
    }
    
    function startDrag(e) {
        isDragging = true;
        baseRect = base.getBoundingClientRect();
        updateJoystick(e);
    }
    
    function stopDrag() {
        isDragging = false;
        stick.style.transform = 'translate(0, 0)';
        rollDegrees = 0;
        pitchDegrees = 0;
        rollLabel.textContent = 'Roll: 0°';
        pitchLabel.textContent = 'Pitch: 0°';
        updateDisplay();
    }
    
    // Add event listeners
    stick.addEventListener('mousedown', startDrag);
    stick.addEventListener('touchstart', startDrag);
    document.addEventListener('mousemove', updateJoystick);
    document.addEventListener('touchmove', updateJoystick);
    document.addEventListener('mouseup', stopDrag);
    document.addEventListener('touchend', stopDrag);
}

// Modify the populateFlowSelect function to include the new flow
function populateFlowSelect() {
    const flowSelect = document.getElementById('flowSelect');
    flowSelect.innerHTML = '';
    
    Object.keys(flows).forEach(flow => {
        const option = document.createElement('option');
        option.value = flow;
        option.textContent = toTitleCase(flow);
        flowSelect.appendChild(option);
    });
    
    // Initialize or remove joystick when levelling flow is selected
    flowSelect.addEventListener('change', (e) => {
        // Remove existing joystick if it exists
        const existingJoystick = document.querySelector('.joystick-container');
        if (existingJoystick) {
            existingJoystick.remove();
        }
        
        // Initialize joystick only for levelling flow
        if (e.target.value === 'levelling') {
            initJoystick();
        }
    });
}

// Function to update the display
function updateDisplay() {
    // Check if in sleep mode
    if (isSleepMode) {
        drawSleepMode(ctx);
        return;
    }
    
    const currentStates = flows[currentFlow];
    const currentState = currentStates[currentStateIndex];
    
    // Update cable visibility based on flow
    updateCableVisibility(currentFlow === 'cable charging');
    
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, LCD_WIDTH, LCD_HEIGHT);
    
    // Handle animation cleanup
    if (currentAnimation) {
        if (typeof currentAnimation === 'object' && currentAnimation.animation) {
            currentAnimation.animation.stop();
            currentAnimation.animation.destroy();
            if (currentAnimation.container && currentAnimation.container.parentNode) {
                currentAnimation.container.parentNode.removeChild(currentAnimation.container);
            }
        } else if (currentAnimation.destroy) {
            currentAnimation.destroy();
        }
        currentAnimation = null;
    }
    
    // Remove any existing gif containers
    const existingContainers = document.querySelectorAll('[data-gif-container="true"]');
    existingContainers.forEach(container => {
        if (container.parentNode) {
            container.parentNode.removeChild(container);
        }
    });
    
    // Clear connection animation persistent elements when switching away from connection flows
    if (!currentFlow.includes('Connection Animations')) {
        // Remove any success tick containers
        const successContainers = document.querySelectorAll('div[style*="z-index: 5"]');
        successContainers.forEach(container => {
            if (container.parentNode) {
                container.parentNode.removeChild(container);
            }
        });
        
        // Remove any dot animation containers
        const dotContainers = document.querySelectorAll('img[src*="dot animation.gif"]');
        dotContainers.forEach(img => {
            if (img.parentNode) {
                img.parentNode.removeChild(img.parentNode);
            }
        });
        
        // Remove any success images
        const successImages = document.querySelectorAll('img[src*="success.png"]');
        successImages.forEach(img => {
            if (img.parentNode) {
                img.parentNode.removeChild(img.parentNode);
            }
        });
    }
    
    // Handle animation setup
    if (currentState.onEnter) {
        currentAnimation = currentState.onEnter();
        // If onEnter returns null, we still need to draw the state
        if (!currentAnimation) {
            currentState.draw(ctx);
        }
    } else {
        // Draw current state if no animation
        currentState.draw(ctx);
    }
    
    // Update LED state
    ledLight.className = 'led-light';
    if (currentState.led) {
        ledLight.classList.add(currentState.led.state);
        ledLight.classList.add(currentState.led.color);
        if (currentState.led.state === 'on') {
            ledLight.classList.add('on');
        }
    }
    
    // Update explanation
    explanationText.textContent = currentState.explanation;
    
    // Update step indicator
    currentStepSpan.textContent = currentStateIndex + 1;
    totalStepsSpan.textContent = currentStates.length;
    
    // Update button states
    prevButton.disabled = currentStateIndex === 0;
    nextButton.disabled = currentStateIndex === currentStates.length - 1;
}

// Event listeners for navigation
prevButton.addEventListener('click', () => {
    if (currentStateIndex > 0) {
        currentStateIndex--;
        updateDisplay();
    }
});

nextButton.addEventListener('click', () => {
    if (currentStateIndex < flows[currentFlow].length - 1) {
        currentStateIndex++;
        updateDisplay();
    }
});

// Event listener for flow selection
flowSelect.addEventListener('change', (e) => {
    // Reset all state variables
    currentFlow = e.target.value;
    currentStateIndex = 0;
    connectionState = 'searching';
    isChargerConnected = false;
    updateProgress = 0;
    showSerialNumber = false;
    isPowerButtonPressed = false;
    powerButtonPressStartTime = 0;
    
    // Update dynamic buttons for new flow
    updateDynamicButtons();
    
    // Reset ball state when entering ShotState
    if (currentFlow === 'ShotState') {
        ballCount = 0;
        isShotInProgress = false;
        updateBallState();
        return; // Don't call updateDisplay as updateBallState handles it
    }
    
    // Reset cable element if it exists
    const cableElement = document.getElementById('cable');
    if (cableElement) {
        cableElement.style.display = 'none';
        cableElement.style.transform = '';
        cableElement.style.transition = '';
        cableElement.style.opacity = '';
    }
    
    // Clean up any existing animations
    if (currentAnimation) {
        if (typeof currentAnimation === 'object' && currentAnimation.animation) {
            currentAnimation.animation.stop();
            currentAnimation.animation.destroy();
            if (currentAnimation.container && currentAnimation.container.parentNode) {
                currentAnimation.container.parentNode.removeChild(currentAnimation.container);
            }
        } else if (currentAnimation.destroy) {
            currentAnimation.destroy();
        }
        currentAnimation = null;
    }
    
    // Update the display with fresh state
    updateDisplay();
});

// Power state variables
let powerPressTimeout = null;
let isShuttingDown = false;
let shutdownStartTime = 0;
let countdownInterval = null;
let isPoweredOff = true; // Track power state

function startPowerOn() {
    if (!isPoweredOff) return; // Only power on if currently off
    
    isPoweredOff = false;
    currentFlow = 'power';
    currentStateIndex = 1; // Move to power on animation state
    updateDisplay();
}

function startShutdownCountdown() {
    if (isShuttingDown) return; // Prevent multiple triggers
    
    isShuttingDown = true;
    shutdownStartTime = Date.now();
    
    // Switch to shutdown state
    currentFlow = 'power';
    currentStateIndex = 4; // Move to shutdown state
    updateDisplay();
    
    // Start countdown animation
    countdownInterval = setInterval(() => {
        const elapsedTime = (Date.now() - shutdownStartTime) / 1000;
        const remainingTime = Math.max(0, (SHUTDOWN_HOLD_TIME / 1000) - elapsedTime);
        
        if (remainingTime <= 0) {
            // Complete shutdown
            clearInterval(countdownInterval);
            currentStateIndex = 5; // Move to shutdown complete state
            updateDisplay();
            isPoweredOff = true; // Set power state to off
        }
    }, 50); // Update every 50ms for smooth animation
}

function cancelShutdown() {
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }
    isShuttingDown = false;
    
    // Return to Fully On state
    currentStateIndex = 3; // Move to Fully On state
    updateDisplay();
}





// Add function to update progress from mobile
function updateFirmwareProgress(progress) {
    updateProgress = progress;
    if (progress >= 1) {
        // Move to complete state
        currentStateIndex = 2;
        updateDisplay();
    }
}

// After flows object and before updateDisplay or any event listeners
function toTitleCase(str) {
    return str.replace(/([A-Z])/g, ' $1')
        .replace(/^./, function(txt){ return txt.toUpperCase(); })
        .replace(/\b\w/g, function(txt){ return txt.toUpperCase(); })
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/_/g, ' ');
}

populateFlowSelect();

// Initialize the display
updateDisplay(); 

// Add this function near the top with other drawing functions
function drawSuccessAnimation(ctx, frame) {
    // Animation phases
    const fullHeightDuration = 60;  // 1 second full height
    const minimizeDuration = 30;    // 0.5 seconds minimize
    const textDuration = 180;       // 3 seconds with text
    const totalDuration = fullHeightDuration + minimizeDuration + textDuration;
    
    // Calculate progress for each phase
    const fullHeightProgress = Math.min(1, frame / fullHeightDuration);
    const minimizeProgress = Math.max(0, Math.min(1, (frame - fullHeightDuration) / minimizeDuration));
    const textProgress = Math.max(0, Math.min(1, (frame - fullHeightDuration - minimizeDuration) / 30));
    
    // Calculate sizes and positions
    const strokeWidth = scaleSize(3);
    const fullSize = scaleSize(38);  // Scaled to new resolution
    const smallSize = scaleSize(15); // Increased minimized size
    const currentSize = frame < fullHeightDuration ? fullSize : 
                       fullSize - (fullSize - smallSize) * minimizeProgress;
    
    // Calculate positions - centered in the screen
    const centerX = CENTER_X;  // Center of screen
    const centerY = CENTER_Y;  // Center of screen
    
    // Calculate final position offset
    const finalX = centerX + 0; // Move right by 50 pixels when minimized
    const finalY = centerY - 10; // Move up by 10 pixels when minimized
    
    // Calculate current position based on animation progress
    const currentX = frame < fullHeightDuration ? centerX : 
                    centerX + ((finalX - centerX) * minimizeProgress);
    const currentY = frame < fullHeightDuration ? centerY : 
                    centerY + ((finalY - centerY) * minimizeProgress);
    
    // Draw animated circle
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = strokeWidth;
    ctx.beginPath();
    ctx.arc(currentX, currentY, currentSize, 0, Math.PI * 2);
    ctx.stroke();
    
    // Draw checkmark (scaled with circle)
    const checkScale = currentSize / fullSize;
    const checkOffset = scaleSize(16) * checkScale; // Adjusted for new size
    ctx.beginPath();
    ctx.moveTo(currentX - checkOffset, currentY);
    ctx.lineTo(currentX - checkOffset/2, currentY + checkOffset/2);
    ctx.lineTo(currentX + checkOffset, currentY - checkOffset/2);
    ctx.stroke();
    
    // Draw text when minimized
    if (frame >= fullHeightDuration + minimizeDuration) {
        ctx.fillStyle = `rgba(255, 255, 255, ${textProgress})`;
        ctx.font = scaleSize(18) + 'px Barlow Light';
        ctx.fontWeight = '400';
        ctx.textAlign = 'center';
        ctx.fillText('Update Complete', centerX, scaleY(60)); // Keep text centered
    }
    
    return frame < totalDuration; // Return true if animation should continue
}
function drawSuccessAnimationlink(ctx, frame) {
    // Animation phases
    const fullHeightDuration = 60;  // 1 second full height
    const minimizeDuration = 30;    // 0.5 seconds minimize
    const textDuration = 180;       // 3 seconds with text
    const totalDuration = fullHeightDuration + minimizeDuration + textDuration;
    
    // Calculate progress for each phase
    const fullHeightProgress = Math.min(1, frame / fullHeightDuration);
    const minimizeProgress = Math.max(0, Math.min(1, (frame - fullHeightDuration) / minimizeDuration));
    const textProgress = Math.max(0, Math.min(1, (frame - fullHeightDuration - minimizeDuration) / 30));
    
    // Calculate sizes and positions
    const strokeWidth = 3;
    const fullSize = 38;  // (80 - strokeWidth*2)/2 to account for stroke width
    const smallSize = 15; // Increased minimized size
    const currentSize = frame < fullHeightDuration ? fullSize : 
                       fullSize - (fullSize - smallSize) * minimizeProgress;
    
    // Calculate positions - centered in the screen
    const centerX = 80;  // Center of screen (160/2)
    const centerY = 40;  // Center of screen (80/2)
    
    // Calculate final position offset
    const finalX = centerX + 0; // Move right by 50 pixels when minimized
    const finalY = centerY - 10; // Move up by 10 pixels when minimized
    
    // Calculate current position based on animation progress
    const currentX = frame < fullHeightDuration ? centerX : 
                    centerX + ((finalX - centerX) * minimizeProgress);
    const currentY = frame < fullHeightDuration ? centerY : 
                    centerY + ((finalY - centerY) * minimizeProgress);
    
    // Draw animated circle
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = strokeWidth;
    ctx.beginPath();
    ctx.arc(currentX, currentY, currentSize, 0, Math.PI * 2);
    ctx.stroke();
    
    // Draw checkmark (scaled with circle)
    const checkScale = currentSize / fullSize;
    const checkOffset = 16 * checkScale; // Adjusted for new size
    ctx.beginPath();
    ctx.moveTo(currentX - checkOffset, currentY);
    ctx.lineTo(currentX - checkOffset/2, currentY + checkOffset/2);
    ctx.lineTo(currentX + checkOffset, currentY - checkOffset/2);
    ctx.stroke();
    
    // Draw text when minimized
    if (frame >= fullHeightDuration + minimizeDuration) {
        ctx.fillStyle = `rgba(255, 255, 255, ${textProgress})`;
        ctx.font = scaleSize(20) + 'px Barlow Light';
        ctx.fontWeight = '400';
        ctx.textAlign = 'center';
        ctx.fillText('Linking Complete', centerX, 70); // Keep text centered
    }
    
    return frame < totalDuration; // Return true if animation should continue
}
function drawSuccessAnimationConnect(ctx, frame) {
    // Animation phases
    const fullHeightDuration = 60;  // 1 second full height
    const minimizeDuration = 30;    // 0.5 seconds minimize
    const textDuration = 180;       // 3 seconds with text
    const totalDuration = fullHeightDuration + minimizeDuration + textDuration;
    
    // Calculate progress for each phase
    const fullHeightProgress = Math.min(1, frame / fullHeightDuration);
    const minimizeProgress = Math.max(0, Math.min(1, (frame - fullHeightDuration) / minimizeDuration));
    const textProgress = Math.max(0, Math.min(1, (frame - fullHeightDuration - minimizeDuration) / 30));
    
    // Calculate sizes and positions
    const strokeWidth = 3;
    const fullSize = 25;  // (80 - strokeWidth*2)/2 to account for stroke width
    const smallSize = 15; // Increased minimized size
    const currentSize = frame < fullHeightDuration ? fullSize : 
                       fullSize - (fullSize - smallSize) * minimizeProgress;
    
    // Calculate positions - centered in the screen
    const centerX = 80;  // Center of screen (160/2)
    const centerY = 30;  // Center of screen (80/2)
    
    // Calculate final position offset
    const finalX = centerX + 0; // Move right by 50 pixels when minimized
    const finalY = centerY - 10; // Move up by 10 pixels when minimized
    
    // Calculate current position based on animation progress
    const currentX = frame < fullHeightDuration ? centerX : 
                    centerX + ((finalX - centerX) * minimizeProgress);
    const currentY = frame < fullHeightDuration ? centerY : 
                    centerY + ((finalY - centerY) * minimizeProgress);
    
    // Draw animated circle
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = strokeWidth;
    ctx.beginPath();
    ctx.arc(currentX, currentY, currentSize, 0, Math.PI * 2);
    ctx.stroke();
    
    // Draw checkmark (scaled with circle)
    const checkScale = currentSize / fullSize;
    const checkOffset = 16 * checkScale; // Adjusted for new size
    ctx.beginPath();
    ctx.moveTo(currentX - checkOffset, currentY);
    ctx.lineTo(currentX - checkOffset/2, currentY + checkOffset/2);
    ctx.lineTo(currentX + checkOffset, currentY - checkOffset/2);
    ctx.stroke();
    
    // Draw text when minimized
    if (frame >= fullHeightDuration + minimizeDuration) {
        ctx.fillStyle = `rgba(255, 255, 255, ${textProgress})`;
        ctx.font = scaleSize(20) + 'px Barlow Light';
        ctx.fontWeight = '400';
        ctx.textAlign = 'center';
        ctx.fillText('Connected', centerX, 55); // Keep text centered
    }
    
    return frame < totalDuration; // Return true if animation should continue
}

// Add the new reusable battery animation function
function drawAnimatedBattery(ctx, frame, options = {}) {
    const {
        x = scaleX(32),
        y = scaleY(5),
        width = scaleX(90),
        height = scaleY(45),
        radius = scaleSize(6),
        cycle = 2000,
        showPercentage = true,
        percentageY = null,  // Will be calculated based on battery position
        forcePercent = null,  // New option to force a specific percentage
        shimmer = false      // Option to enable shimmer was unused before
    } = options;

    // Use forced percentage if provided, otherwise calculate from frame
    const percent = forcePercent !== null ? forcePercent : ((frame % cycle) / (cycle - 1)) * 100;
    
    // Draw battery outline with rounded corners
    ctx.save();
    ctx.strokeStyle = percent > 90 ? '#00ff00' : '#fff';  // Green when above 90%
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
    
    // Battery tip
    ctx.fillStyle = percent > 90 ? '#00ff00' : '#fff';  // Green when above 90%
    ctx.fillRect(x + width, y + height / 4, scaleX(8), height / 2);
    
    // Percentage text if enabled
    if (showPercentage) {
        // Add pulsing effect based on the current percentage value
        // Higher percent values will pulse more subtly
        /*  const pulseIntensity = 0.4; // Decreases from 0.3 to 0.1 as percentage increases
            const pulseSpeed = 0.1;   // Decreases from 0.15 to 0.1 as percentage increases
            const pulseOffset = Math.sin(frame * pulseSpeed) * pulseIntensity;
            const textOpacity = 0.7 + pulseOffset;
        */
        const textOpacity = 1;
        ctx.fillStyle = `rgba(255, 255, 255, ${textOpacity})`;
        ctx.font = scaleSize(19) + 'px Barlow Light';  // Scaled font size
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Center text vertically in the battery
        const textY = y + (height / 2);
        ctx.fillText(Math.round(percent) + '%', x + width/2, textY);
    }
} 

// Helper functions for State Transitions animation
function drawLoadingSpinner(ctx, x, y, radius, frame, color) {
    // Draw spinning segments
    const segments = 8;
    const segmentAngle = (Math.PI * 2) / segments;
    const rotationSpeed = 0.05;
    const rotation = frame * rotationSpeed;
    
    for (let i = 0; i < segments; i++) {
        const angle = rotation + i * segmentAngle;
        const opacity = 0.3 + (0.7 * (i / segments));
        
        ctx.strokeStyle = color.replace(')', `, ${opacity})`).replace('rgb', 'rgba');
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, radius, angle, angle + segmentAngle * 0.7);
        ctx.stroke();
    }
    
    // Draw center dot
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 4, 0, Math.PI * 2);
    ctx.fill();
}

function drawCheckmark(ctx, x, y, radius, color) {
    // Draw circle
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();
    
    // Draw checkmark
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x - 10, y);
    ctx.lineTo(x - 3, y + 8);
    ctx.lineTo(x + 12, y - 10);
    ctx.stroke();
}

function drawXmark(ctx, x, y, radius, color) {
    // Draw circle
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();
    
    // Draw X
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x - 10, y - 10);
    ctx.lineTo(x + 10, y + 10);
    ctx.moveTo(x + 10, y - 10);
    ctx.lineTo(x - 10, y + 10);
    ctx.stroke();
}

function morphSpinnerToCheckmark(ctx, x, y, radius, frame, progress, fromColor, toColor) {
    // Interpolate color
    const color = interpolateColor(fromColor, toColor, progress);
    
    // Draw circle (common to both)
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();
    
    // Draw fading spinner
    if (progress < 0.5) {
        const spinnerOpacity = 1 - (progress * 2);
        const segments = 8;
        const segmentAngle = (Math.PI * 2) / segments;
        const rotationSpeed = 0.05;
        const rotation = frame * rotationSpeed;
        
        for (let i = 0; i < segments; i++) {
            const angle = rotation + i * segmentAngle;
            const opacity = (0.3 + (0.7 * (i / segments))) * spinnerOpacity;
            
            ctx.strokeStyle = color.replace(')', `, ${opacity})`).replace('rgb', 'rgba');
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(x, y, radius, angle, angle + segmentAngle * 0.7);
            ctx.stroke();
        }
    }
    
    // Draw emerging checkmark
    if (progress > 0.5) {
        const checkOpacity = (progress - 0.5) * 2;
        
        ctx.strokeStyle = color.replace(')', `, ${checkOpacity})`).replace('rgb', 'rgba');
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(x - 10, y);
        ctx.lineTo(x - 10 + 7 * checkOpacity, y + 8 * checkOpacity);
        ctx.lineTo(x - 3 + 15 * checkOpacity, y + 8 - 18 * checkOpacity);
        ctx.stroke();
    }
    
    // Draw center dot that morphs into checkmark start
    const dotSize = 4 * (1 - progress);
    if (dotSize > 0) {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, dotSize, 0, Math.PI * 2);
        ctx.fill();
    }
}

function morphCheckmarkToX(ctx, x, y, radius, progress, fromColor, toColor) {
    // Interpolate color
    const color = interpolateColor(fromColor, toColor, progress);
    
    // Draw circle (common to both)
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();
    
    // Morph checkmark to X
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    
    if (progress < 0.5) {
        // First half: checkmark fades out
        const checkOpacity = 1 - (progress * 2);
        ctx.globalAlpha = checkOpacity;
        
        // Draw checkmark
        ctx.beginPath();
        ctx.moveTo(x - 10, y);
        ctx.lineTo(x - 3, y + 8);
        ctx.lineTo(x + 12, y - 10);
        ctx.stroke();
        
        ctx.globalAlpha = 1;
    } else {
        // Second half: X fades in
        const xOpacity = (progress - 0.5) * 2;
        ctx.globalAlpha = xOpacity;
        
        // Draw X
        ctx.beginPath();
        ctx.moveTo(x - 10, y - 10);
        ctx.lineTo(x + 10, y + 10);
        ctx.moveTo(x + 10, y - 10);
        ctx.lineTo(x - 10, y + 10);
        ctx.stroke();
        
        ctx.globalAlpha = 1;
    }
}

function morphXToSpinner(ctx, x, y, radius, frame, progress, fromColor, toColor) {
    // Interpolate color
    const color = interpolateColor(fromColor, toColor, progress);
    
    // Draw circle (common to both)
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();
    
    if (progress < 0.5) {
        // First half: X fades out
        const xOpacity = 1 - (progress * 2);
        ctx.globalAlpha = xOpacity;
        
        // Draw X
        ctx.strokeStyle = color;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(x - 10, y - 10);
        ctx.lineTo(x + 10, y + 10);
        ctx.moveTo(x + 10, y - 10);
        ctx.lineTo(x - 10, y + 10);
        ctx.stroke();
        
        ctx.globalAlpha = 1;
    } else {
        // Second half: spinner fades in
        const spinnerOpacity = (progress - 0.5) * 2;
        const segments = 8;
        const segmentAngle = (Math.PI * 2) / segments;
        const rotationSpeed = 0.05;
        const rotation = frame * rotationSpeed;
        
        for (let i = 0; i < segments; i++) {
            const angle = rotation + i * segmentAngle;
            const opacity = (0.3 + (0.7 * (i / segments))) * spinnerOpacity;
            
            ctx.strokeStyle = color.replace(')', `, ${opacity})`).replace('rgb', 'rgba');
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(x, y, radius, angle, angle + segmentAngle * 0.7);
            ctx.stroke();
        }
        
        // Draw center dot
        const dotSize = 4 * spinnerOpacity;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, dotSize, 0, Math.PI * 2);
        ctx.fill();
    }
}

function interpolateColor(color1, color2, ratio) {
    // Extract RGB components
    const r1 = parseInt(color1.slice(1, 3), 16) || parseInt(color1.match(/\d+/g)[0]);
    const g1 = parseInt(color1.slice(3, 5), 16) || parseInt(color1.match(/\d+/g)[1]);
    const b1 = parseInt(color1.slice(5, 7), 16) || parseInt(color1.match(/\d+/g)[2]);
    
    const r2 = parseInt(color2.slice(1, 3), 16) || parseInt(color2.match(/\d+/g)[0]);
    const g2 = parseInt(color2.slice(3, 5), 16) || parseInt(color2.match(/\d+/g)[1]);
    const b2 = parseInt(color2.slice(5, 7), 16) || parseInt(color2.match(/\d+/g)[2]);
    
    // Interpolate
    const r = Math.round(r1 + (r2 - r1) * ratio);
    const g = Math.round(g1 + (g2 - g1) * ratio);
    const b = Math.round(b1 + (b2 - b1) * ratio);
    
    return `rgb(${r}, ${g}, ${b})`;
}

// Additional helper functions for Lottie-Style Loader
function drawLottieLoader(ctx, x, y, frame, color, isTransitioning, transitionProgress, nextStateName) {
    const radius = 30;
    const strokeWidth = 4;
    
    // Draw the main circle outline
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = strokeWidth;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();
    
    // Calculate the animated segment
    const rotationSpeed = 0.03;
    const baseAngle = frame * rotationSpeed;
    
    // For the main circular loader animation
    if (!isTransitioning) {
        // Draw the spinning arc that grows and shrinks
        const growDuration = 60;
        const shrinkDuration = 60;
        const fullCycleDuration = growDuration + shrinkDuration;
        const cyclePosition = frame % fullCycleDuration;
        
        let arcLength;
        if (cyclePosition < growDuration) {
            // Growing phase
            arcLength = (cyclePosition / growDuration) * Math.PI * 1.75;
        } else {
            // Shrinking phase
            arcLength = (1 - ((cyclePosition - growDuration) / shrinkDuration)) * Math.PI * 1.75;
        }
        
        // Draw the arc
        ctx.strokeStyle = color;
        ctx.lineWidth = strokeWidth;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(x, y, radius, baseAngle, baseAngle + arcLength);
        ctx.stroke();
        ctx.lineCap = 'butt'; // Reset cap style
    } 
    // Handle transition to next state
    else {
        if (nextStateName === 'ready') {
            // Transition to checkmark
            const endAngle = baseAngle + Math.PI * 1.5;
            const arcLength = Math.PI * 1.5 * (1 - transitionProgress);
            
            // Draw the transitioning arc
            ctx.strokeStyle = color;
            ctx.lineWidth = strokeWidth;
            ctx.lineCap = 'round';
            ctx.beginPath();
            ctx.arc(x, y, radius, baseAngle, baseAngle + arcLength);
            ctx.stroke();
            
            // Draw emerging checkmark
            if (transitionProgress > 0.3) {
                const checkProgress = (transitionProgress - 0.3) / 0.7; // Rescale to 0-1
                ctx.strokeStyle = color;
                ctx.lineWidth = strokeWidth;
                ctx.lineCap = 'round';
                
                // First part of checkmark
                ctx.beginPath();
                const startX = x - 15;
                const startY = y;
                const midX = x - 5;
                const midY = y + 10;
                ctx.moveTo(startX, startY);
                ctx.lineTo(startX + (midX - startX) * checkProgress, 
                           startY + (midY - startY) * checkProgress);
                ctx.stroke();
                
                // Second part of checkmark (only if first part is complete)
                if (checkProgress > 0.5) {
                    const check2Progress = (checkProgress - 0.5) / 0.5; // Rescale to 0-1
                    ctx.beginPath();
                    ctx.moveTo(midX, midY);
                    ctx.lineTo(midX + (x + 15 - midX) * check2Progress, 
                               midY + (y - 15 - midY) * check2Progress);
                    ctx.stroke();
                }
            }
        } else if (nextStateName === 'not-ready') {
            // Transition to X mark
            const arcFadeOut = 1 - transitionProgress;
            
            // Fade out the arc
            if (arcFadeOut > 0) {
                ctx.strokeStyle = color.replace(')', `, ${arcFadeOut})`).replace('rgb', 'rgba');
                ctx.lineWidth = strokeWidth;
                ctx.lineCap = 'round';
                ctx.beginPath();
                ctx.arc(x, y, radius, baseAngle, baseAngle + Math.PI);
                ctx.stroke();
            }
            
            // Draw emerging X
            if (transitionProgress > 0.3) {
                const xProgress = (transitionProgress - 0.3) / 0.7; // Rescale to 0-1
                ctx.strokeStyle = color;
                ctx.lineWidth = strokeWidth;
                ctx.lineCap = 'round';
                
                // First diagonal of X
                ctx.beginPath();
                ctx.moveTo(x - 12, y - 12);
                ctx.lineTo(x - 12 + 24 * xProgress, y - 12 + 24 * xProgress);
                ctx.stroke();
                
                // Second diagonal of X (only if first is complete enough)
                if (xProgress > 0.5) {
                    const x2Progress = (xProgress - 0.5) / 0.5; // Rescale to 0-1
                    ctx.beginPath();
                    ctx.moveTo(x + 12, y - 12);
                    ctx.lineTo(x + 12 - 24 * x2Progress, y - 12 + 24 * x2Progress);
                    ctx.stroke();
                }
            }
        }
    }
}

function drawLottieReady(ctx, x, y, color, isTransitioning, transitionProgress) {
    const radius = 30;
    const strokeWidth = 4;
    
    // Draw the main circle outline
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = strokeWidth;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();
    
    // If transitioning to not-ready
    if (isTransitioning) {
        // Fade out checkmark
        const checkOpacity = 1 - transitionProgress;
        ctx.strokeStyle = color.replace(')', `, ${checkOpacity})`).replace('rgb', 'rgba');
        
        // Draw fading checkmark
        ctx.lineWidth = strokeWidth;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x - 15, y);
        ctx.lineTo(x - 5, y + 10);
        ctx.lineTo(x + 15, y - 15);
        ctx.stroke();
        
        // Draw emerging X
        if (transitionProgress > 0.3) {
            const xProgress = (transitionProgress - 0.3) / 0.7; // Rescale to 0-1
            ctx.strokeStyle = color;
            ctx.lineWidth = strokeWidth;
            
            // First diagonal of X
            ctx.beginPath();
            ctx.moveTo(x - 12, y - 12);
            ctx.lineTo(x - 12 + 24 * xProgress, y - 12 + 24 * xProgress);
            ctx.stroke();
            
            // Second diagonal of X (only if first is complete enough)
            if (xProgress > 0.5) {
                const x2Progress = (xProgress - 0.5) / 0.5; // Rescale to 0-1
                ctx.beginPath();
                ctx.moveTo(x + 12, y - 12);
                ctx.lineTo(x + 12 - 24 * x2Progress, y - 12 + 24 * x2Progress);
                ctx.stroke();
            }
        }
    } else {
        // Draw static checkmark with subtle pulse
        ctx.strokeStyle = color;
        ctx.lineWidth = strokeWidth;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x - 15, y);
        ctx.lineTo(x - 5, y + 10);
        ctx.lineTo(x + 15, y - 15);
        ctx.stroke();
    }
}

function drawLottieNotReady(ctx, x, y, color, isTransitioning, transitionProgress) {
    const radius = 30;
    const strokeWidth = 4;
    
    // Draw the main circle outline
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = strokeWidth;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.stroke();
    
    // If transitioning to loading
    if (isTransitioning) {
        // Fade out X
        const xOpacity = 1 - transitionProgress;
        ctx.strokeStyle = color.replace(')', `, ${xOpacity})`).replace('rgb', 'rgba');
        
        // Draw fading X
        ctx.lineWidth = strokeWidth;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x - 12, y - 12);
        ctx.lineTo(x + 12, y + 12);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(x + 12, y - 12);
        ctx.lineTo(x - 12, y + 12);
        ctx.stroke();
        
        // Draw emerging spinner
        if (transitionProgress > 0.5) {
            const spinProgress = (transitionProgress - 0.5) / 0.5; // Rescale to 0-1
            
            // Draw emerging arc
            ctx.strokeStyle = color;
            ctx.lineWidth = strokeWidth;
            ctx.lineCap = 'round';
            ctx.beginPath();
            const startAngle = 0;
            const endAngle = Math.PI * 2 * spinProgress;
            ctx.arc(x, y, radius, startAngle, endAngle);
            ctx.stroke();
        }
    } else {
        // Draw static X with subtle pulse
        ctx.strokeStyle = color;
        ctx.lineWidth = strokeWidth;
        ctx.lineCap = 'round';
        
        ctx.beginPath();
        ctx.moveTo(x - 12, y - 12);
        ctx.lineTo(x + 12, y + 12);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(x + 12, y - 12);
        ctx.lineTo(x - 12, y + 12);
        ctx.stroke();
    }
}

// Helper functions for Lottie Morphing Loader
function drawMorphToSuccess(ctx, progress) {
    const centerX = 80, centerY = 40, radius = 20;
    const fromColor = '#4285F4'; // Blue
    const toColor = '#34A853';   // Green
    const color = interpolateColor(fromColor, toColor, progress);

    // Draw the circle base
    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2 * (1 - progress)); // Circle shrinks
    ctx.stroke();

    // Morph to checkmark
    if (progress > 0.3) {
        const checkProgress = (progress - 0.3) / 0.7;
        ctx.lineCap = 'round';

        // First part of check
        const startX = centerX - 10;
        const startY = centerY + 5;
        const midX = centerX - 2;
        const midY = centerY + 13;
        const p1x = startX + (midX - startX) * checkProgress;
        const p1y = startY + (midY - startY) * checkProgress;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(p1x, p1y);
        ctx.stroke();

        // Second part of check
        if (checkProgress > 0.5) {
            const check2Progress = (checkProgress - 0.5) / 0.5;
            const endX = centerX + 15;
            const endY = centerY - 10;
            const p2x = midX + (endX - midX) * check2Progress;
            const p2y = midY + (endY - midY) * check2Progress;
            ctx.beginPath();
            ctx.moveTo(midX, midY);
            ctx.lineTo(p2x, p2y);
            ctx.stroke();
        }
        ctx.lineCap = 'butt';
    }
}

function drawMorphToFail(ctx, progress) {
    const centerX = 80, centerY = 40, radius = 20;
    const fromColor = '#34A853'; // Green
    const toColor = '#EA4335';   // Red
    const color = interpolateColor(fromColor, toColor, progress);

    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';

    // Reverse morph checkmark to lines
    const checkProgress = 1 - progress;
    const startX1 = centerX - 10, startY1 = centerY + 5;
    const midX = centerX - 2, midY = centerY + 13;
    const endX = centerX + 15, endY = centerY - 10;
    
    // First line of check (disappears)
    ctx.globalAlpha = checkProgress;
    ctx.beginPath();
    ctx.moveTo(startX1, startY1);
    ctx.lineTo(midX, midY);
    ctx.stroke();

    // Second line of check (disappears)
    ctx.beginPath();
    ctx.moveTo(midX, midY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Morph lines to X
    const p1_start = { x: startX1, y: startY1 };
    const p1_end = { x: midX, y: midY };
    const p2_start = { x: midX, y: midY };
    const p2_end = { x: endX, y: endY };
    
    const x1_target_start = { x: centerX - 12, y: centerY - 12 };
    const x1_target_end = { x: centerX + 12, y: centerY + 12 };
    const x2_target_start = { x: centerX + 12, y: centerY - 12 };
    const x2_target_end = { x: centerX - 12, y: centerY + 12 };

    const lerp = (a, b, t) => a + (b - a) * t;

    // First diagonal of X
    const x1_start = { x: lerp(p1_start.x, x1_target_start.x, progress), y: lerp(p1_start.y, x1_target_start.y, progress) };
    const x1_end = { x: lerp(p1_end.x, x1_target_end.x, progress), y: lerp(p1_end.y, x1_target_end.y, progress) };
    ctx.beginPath();
    ctx.moveTo(x1_start.x, x1_start.y);
    ctx.lineTo(x1_end.x, x1_end.y);
    ctx.stroke();
    
    // Second diagonal of X
    const x2_start = { x: lerp(p2_start.x, x2_target_start.x, progress), y: lerp(p2_start.y, x2_target_start.y, progress) };
    const x2_end = { x: lerp(p2_end.x, x2_target_end.x, progress), y: lerp(p2_end.y, x2_target_end.y, progress) };
    ctx.beginPath();
    ctx.moveTo(x2_start.x, x2_start.y);
    ctx.lineTo(x2_end.x, x2_end.y);
    ctx.stroke();

    ctx.lineCap = 'butt';
}

function drawMorphToFail(ctx, progress) {
    const centerX = 80, centerY = 40, radius = 20;
    const fromColor = '#34A853'; // Green
    const toColor = '#EA4335';   // Red
    const color = interpolateColor(fromColor, toColor, progress);

    ctx.strokeStyle = color;
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';

    // Reverse morph checkmark to lines
    const checkProgress = 1 - progress;
    const startX1 = centerX - 10, startY1 = centerY + 5;
    const midX = centerX - 2, midY = centerY + 13;
    const endX = centerX + 15, endY = centerY - 10;
    
    // First line of check (disappears)
    ctx.globalAlpha = checkProgress;
    ctx.beginPath();
    ctx.moveTo(startX1, startY1);
    ctx.lineTo(midX, midY);
    ctx.stroke();

    // Second line of check (disappears)
    ctx.beginPath();
    ctx.moveTo(midX, midY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Morph lines to X
    const p1_start = { x: startX1, y: startY1 };
    const p1_end = { x: midX, y: midY };
    const p2_start = { x: midX, y: midY };
    const p2_end = { x: endX, y: endY };
    
    const x1_target_start = { x: centerX - 12, y: centerY - 12 };
    const x1_target_end = { x: centerX + 12, y: centerY + 12 };
    const x2_target_start = { x: centerX + 12, y: centerY - 12 };
    const x2_target_end = { x: centerX - 12, y: centerY + 12 };

    const lerp = (a, b, t) => a + (b - a) * t;

    // First diagonal of X
    const x1_start = { x: lerp(p1_start.x, x1_target_start.x, progress), y: lerp(p1_start.y, x1_target_start.y, progress) };
    const x1_end = { x: lerp(p1_end.x, x1_target_end.x, progress), y: lerp(p1_end.y, x1_target_end.y, progress) };
    ctx.beginPath();
    ctx.moveTo(x1_start.x, x1_start.y);
    ctx.lineTo(x1_end.x, x1_end.y);
    ctx.stroke();
    
    // Second diagonal of X
    const x2_start = { x: lerp(p2_start.x, x2_target_start.x, progress), y: lerp(p2_start.y, x2_target_start.y, progress) };
    const x2_end = { x: lerp(p2_end.x, x2_target_end.x, progress), y: lerp(p2_end.y, x2_target_end.y, progress) };
    ctx.beginPath();
    ctx.moveTo(x2_start.x, x2_start.y);
    ctx.lineTo(x2_end.x, x2_end.y);
    ctx.stroke();

    ctx.lineCap = 'butt';
}

// Add these constants at the top of the file
const FRAME_RATE = 60; // Expected frame rate
const TIMING_MULTIPLIER = 0.5; // Adjust timing to match actual frame rate

// Helper function to convert seconds to frames
function secondsToFrames(seconds) {
    return Math.floor(seconds * FRAME_RATE * TIMING_MULTIPLIER);
}

// Helper function to convert frames to seconds
function framesToSeconds(frames) {
    return frames / (FRAME_RATE * TIMING_MULTIPLIER);
}

// Add this function after the drawBattery function
function drawSignalBars(ctx, strength) {
    const x = scaleX(130);  // Same x as battery
    const y = scaleY(5);    // Same y as battery
    const barCount = 3;
    const barWidth = scaleX(3);
    const barSpacing = scaleX(2);
    const barHeights = strength === -1 ? [scaleY(2), scaleY(2), scaleY(2)] : [scaleY(5), scaleY(8), scaleY(11)]; // All bars 2px tall for no connection
    const trayX = x - (barCount * (barWidth + barSpacing)) - scaleX(5); // Position bars to the left of battery
    const trayY = y + 0;  // Moved 1px higher (was y + 2)
    
    // Draw each bar
    for (let i = 0; i < barCount; i++) {
        ctx.fillStyle = i < strength ? '#ffffff' : '#333333';  // White for active bars, dark gray for inactive
        ctx.fillRect(
            trayX + (i * (barWidth + barSpacing)),
            trayY + (barHeights[barCount - 1] - barHeights[i]),
            barWidth,
            barHeights[i]
        );
    }
}

function drawClock(ctx) {
    const centerX = CENTER_X;
    const centerY = CENTER_Y;
    
    // Get current time
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    
    // Format time as HH:MM
    const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    
    // Set text properties
    ctx.fillStyle = '#fff';
    ctx.font = `300 ${scaleSize(48)}px 'Barlow', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Draw time
    ctx.fillText(timeString, centerX, centerY);
}

function drawSleepMode(ctx) {
    // Create a high z-index overlay for sleep mode
    let sleepOverlay = document.getElementById('sleepOverlay');
    if (!sleepOverlay) {
        sleepOverlay = document.createElement('div');
        sleepOverlay.id = 'sleepOverlay';
        sleepOverlay.style.position = 'absolute';
        sleepOverlay.style.top = '0';
        sleepOverlay.style.left = '0';
        sleepOverlay.style.width = '100%';
        sleepOverlay.style.height = '100%';
        sleepOverlay.style.zIndex = '9999'; // Highest z-index
        sleepOverlay.style.pointerEvents = 'none';
        canvas.parentNode.appendChild(sleepOverlay);
    }
    
    if (sleepFadeProgress < 1) {
        // Fade to black
        sleepOverlay.style.backgroundColor = `rgba(0, 0, 0, ${sleepFadeProgress})`;
        sleepOverlay.style.display = 'block';
    } else {
        // Show clock
        sleepOverlay.style.backgroundColor = '#000';
        sleepOverlay.style.display = 'block';
        
        // Draw clock on the overlay
        const overlayCanvas = document.createElement('canvas');
        overlayCanvas.width = LCD_WIDTH;
        overlayCanvas.height = LCD_HEIGHT;
        overlayCanvas.style.position = 'absolute';
        overlayCanvas.style.top = '0';
        overlayCanvas.style.left = '0';
        overlayCanvas.style.width = '100%';
        overlayCanvas.style.height = '100%';
        
        const overlayCtx = overlayCanvas.getContext('2d');
        drawClock(overlayCtx);
        
        // Clear previous content and add new canvas
        sleepOverlay.innerHTML = '';
        sleepOverlay.appendChild(overlayCanvas);
    }
}

// Sleep button functionality
function initSleepButton() {
    const sleepButton = document.getElementById('sleepButton');
    if (sleepButton) {
        sleepButton.addEventListener('click', () => {
            if (!isSleepMode) {
                // Start sleep mode
                isSleepMode = true;
                sleepFadeProgress = 0;
                sleepStartTime = Date.now();
                
                // Update button text
                sleepButton.textContent = 'Wake';
                // Refresh buttons to update sleep button text in other flows
                updateDynamicButtons();
                
                // Update LED to indicate sleep
                const ledLight = document.getElementById('ledLight');
                if (ledLight) {
                    ledLight.className = 'led-light';
                    ledLight.classList.add('red');
                    ledLight.classList.add('dim');
                }
                
                // Start sleep animation
                animateSleep();
            } else {
                // Wake up
                isSleepMode = false;
                sleepFadeProgress = 0;
                
                // Play wake sound effect
                const wakeSound = new Audio('Assets/game sounds/wake.mp3');
                wakeSound.volume = 0.5; // Set volume to 50%
                wakeSound.play().catch(e => console.log('Audio play failed:', e));
                
                // Update button text
                sleepButton.textContent = 'Sleep';
                // Refresh buttons to update sleep button text in other flows
                updateDynamicButtons();
                
                // Remove sleep overlay
                const sleepOverlay = document.getElementById('sleepOverlay');
                if (sleepOverlay) {
                    sleepOverlay.remove();
                }
                
                // Update LED back to normal
                const ledLight = document.getElementById('ledLight');
                if (ledLight) {
                    ledLight.className = 'led-light';
                }
                
                // Update display to show current state
                updateDisplay();
            }
        });
    }
}

function animateSleep() {
    if (!isSleepMode) return;
    
    const elapsed = Date.now() - sleepStartTime;
    const fadeDuration = 1000; // 1 second fade
    
    if (elapsed < fadeDuration) {
        sleepFadeProgress = elapsed / fadeDuration;
    } else {
        sleepFadeProgress = 1;
    }
    
    // Draw sleep mode
    const ctx = canvas.getContext('2d');
    drawSleepMode(ctx);
    
    // Continue animation
    requestAnimationFrame(animateSleep);
}

// Ball state display functions
function drawPlaceBallMessage(ctx) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, LCD_WIDTH, LCD_HEIGHT);
    
    // Draw typed message for ShotState, GIF overlay for ShotState2
    if (currentFlow === 'ShotState') {
        ctx.fillStyle = '#fff';
        ctx.font = `400 ${scaleSize(24)}px 'Barlow', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('PLACE BALL', CENTER_X, CENTER_Y - scaleSize(0));
    }
    // Note: For ShotState2, the Place.gif will be handled by DOM overlay in the calling function
}

function drawMultipleBallsMessage(ctx) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, LCD_WIDTH, LCD_HEIGHT);
    
    // Draw typed message for ShotState, GIF overlay for ShotState2
    if (currentFlow === 'ShotState') {
        ctx.fillStyle = '#fff';
        ctx.font = `400 ${scaleSize(18)}px 'Barlow', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('MULTIPLE BALLS', CENTER_X, CENTER_Y - scaleSize(10));
        ctx.fillText('DETECTED', CENTER_X, CENTER_Y + scaleSize(12));
    }
    // Note: For ShotState2, the multiple.gif will be handled by DOM overlay in the calling function
}

function showImmediateReady() {
    // Clear the canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, LCD_WIDTH, LCD_HEIGHT);
    
    // Set LED to green
    const ledLight = document.getElementById('ledLight');
    if (ledLight) {
        ledLight.className = 'led-light';
        ledLight.classList.add('on');
        ledLight.classList.add('green');
    }
    
    // Handle ShotState vs ShotState2 differently
    if (currentFlow === 'ShotState') {
        // For ShotState, draw typed "READY" message
        ctx.fillStyle = '#fff';
        ctx.font = `400 ${scaleSize(26)}px 'Barlow', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('READY', CENTER_X, CENTER_Y);
        
        // Play bit beep sound effect
        const bubbleSound = new Audio('Assets/game sounds/bit beep.mp3');
        bubbleSound.volume = 0.5;
        bubbleSound.play().catch(e => console.log('Audio play failed:', e));
        
        // Set up continuous redraw for typed message
        setupShotStateDisplay();
    } else if (currentFlow === 'ShotState2') {
        // For ShotState2, use GIF animation
        // Remove any existing gif containers
        const existingContainers = document.querySelectorAll('[data-gif-container="true"]');
        existingContainers.forEach(container => {
            if (container.parentNode) {
                container.parentNode.removeChild(container);
            }
        });
        
        // Create container for immediate ready sequence
        const gifContainer = document.createElement('div');
        gifContainer.style.position = 'absolute';
        gifContainer.style.top = 0 + 'px';
        gifContainer.style.left = 0 + 'px';
        gifContainer.style.width = canvas.width + 'px';
        gifContainer.style.height = canvas.height + 'px';
        gifContainer.style.zIndex = '0';
        gifContainer.dataset.gifContainer = 'true';
        canvas.parentNode.appendChild(gifContainer);

        // Create and load the image
        const img = document.createElement('img');
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'contain';
        gifContainer.appendChild(img);

        // Start directly with Ready.gif (no loading animation)
        img.src = 'Assets/Main Gif/Ready.gif';
        
        // Play bubble sound effect immediately
        const bubbleSound = new Audio('Assets/game sounds/bit beep.mp3');
        bubbleSound.volume = 0.5;
        bubbleSound.play().catch(e => console.log('Audio play failed:', e));
        
        let startTime = Date.now();
        
        const animate = () => {
            if (currentFlow !== 'ShotState2' || ballCount !== 1 || isShotInProgress) {
                // Cleanup when conditions change
                if (gifContainer.parentNode) {
                    gifContainer.parentNode.removeChild(gifContainer);
                }
                return;
            }
            
            const elapsedTime = Date.now() - startTime;
            
            // After Ready.gif plays for about 2 seconds, switch to Ready0537.png
            if (elapsedTime >= 700) {
                img.src = 'Assets/Main Gif/Ready0537.png';
                // Continue showing Ready0537.png persistently
            }
            
            requestAnimationFrame(animate);
        };
        
        animate();
    }
}

function updateBallState() {
    if (currentFlow !== 'ShotState' && currentFlow !== 'ShotState2') return;
    
    // Clean up any existing GIF containers
    const placeGifContainers = document.querySelectorAll('[data-gif-container="true"]');
    placeGifContainers.forEach(container => {
        if (container.parentNode) {
            container.parentNode.removeChild(container);
        }
    });
    
    // Update ball counter display
    const ballCountDisplay = document.getElementById('ballCountDisplay');
    if (ballCountDisplay) {
        ballCountDisplay.textContent = ballCount;
    }
    
    // Clean up any existing ready animations when ball state changes
    const existingContainers = document.querySelectorAll('[data-gif-container="true"]');
    existingContainers.forEach(container => {
        if (container.parentNode) {
            container.parentNode.removeChild(container);
        }
    });
    
    const ledLight = document.getElementById('ledLight');
    
    if (ballCount === 0) {
        // No balls - show place ball message/GIF and red LED
        drawPlaceBallMessage(ctx);
        
        // Only create GIF overlay for ShotState2
        if (currentFlow === 'ShotState2') {
            // Create container for Place.gif
            const gifContainer = document.createElement('div');
            gifContainer.style.position = 'absolute';
            gifContainer.style.top = 0 + 'px';
            gifContainer.style.left = 0 + 'px';
            gifContainer.style.width = canvas.width + 'px';
            gifContainer.style.height = canvas.height + 'px';
            gifContainer.style.zIndex = '0';
            gifContainer.style.pointerEvents = 'none';
            gifContainer.dataset.gifContainer = 'true';
            canvas.parentNode.appendChild(gifContainer);

            // Create and load the Place.gif
            const img = document.createElement('img');
            img.src = 'Assets/Main Gif/Place.gif';
            img.style.position = 'absolute';
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'contain';
            gifContainer.appendChild(img);

            // After GIF plays for about 2 seconds, switch to static PNG
            setTimeout(() => {
                if (img.parentNode && currentFlow === 'ShotState2') {
                    img.src = 'Assets/Main Gif/Place0537.png';
                }
            }, 700); // 2 seconds
        }
        
        if (ledLight) {
            ledLight.className = 'led-light';
            ledLight.classList.add('on');
            ledLight.classList.add('red');
        }
        // Set up continuous redraw to ensure message stays visible
        setupShotStateDisplay();
    } else if (ballCount === 1) {
        // One ball - show immediate ready animation (no loading) and green LED
        if (!isShotInProgress) {
            showImmediateReady();
        }
    } else {
        // Multiple balls - show multiple balls message/GIF and blinking red LED
        drawMultipleBallsMessage(ctx);
        
        // Only create GIF overlay for ShotState2
        if (currentFlow === 'ShotState2') {
            // Create container for multiple.gif
            const gifContainer = document.createElement('div');
            gifContainer.style.position = 'absolute';
            gifContainer.style.top = 0 + 'px';
            gifContainer.style.left = 0 + 'px';
            gifContainer.style.width = canvas.width + 'px';
            gifContainer.style.height = canvas.height + 'px';
            gifContainer.style.zIndex = '0';
            gifContainer.style.pointerEvents = 'none';
            gifContainer.dataset.gifContainer = 'true';
            canvas.parentNode.appendChild(gifContainer);

            // Create and load the multiple.gif
            const img = document.createElement('img');
            img.src = 'Assets/Main Gif/multiple.gif';
            img.style.position = 'absolute';
            img.style.width = '100%';
            img.style.height = '100%';
            img.style.objectFit = 'contain';
            gifContainer.appendChild(img);

            // After GIF plays for about 2 seconds, switch to static PNG
            setTimeout(() => {
                if (img.parentNode && currentFlow === 'ShotState2') {
                    img.src = 'Assets/Main Gif/multiple0537.png';
                }
            }, 700); // 2 seconds
        }

        // Play error sound
                const errorSound1 = new Audio('Assets/game sounds/neg3.mp3');
                errorSound1.volume = 0.5;
                errorSound1.play().catch(e => console.log('Audio play failed:', e));
        
        // After GIF plays for about 2 seconds, switch to static PNG
        setTimeout(() => {
            if (img.parentNode && (currentFlow === 'ShotState' || currentFlow === 'ShotState2')) {
                img.src = 'Assets/Main Gif/multiple0537.png';
            }
        }, 700); // 2 seconds
        
        if (ledLight) {
            ledLight.className = 'led-light';
            ledLight.classList.add('blinking');
            ledLight.classList.add('red');
        }
        
        // Play error sound for multiple balls
        const errorSound = new Audio('Assets/game sounds/sound-8.mp3');
        errorSound1.volume = 0.5;
        errorSound1.play().catch(e => console.log('Audio play failed:', e));
        
        // Set up continuous redraw to ensure message stays visible
        setupShotStateDisplay();
    }
}

// Ensure ShotState messages remain visible
function setupShotStateDisplay() {
    if ((currentFlow !== 'ShotState' && currentFlow !== 'ShotState2') || isShotInProgress) return;
    
    // Create a simple animation loop to keep the message visible
    let frame = 0;
    const animate = () => {
        if ((currentFlow !== 'ShotState' && currentFlow !== 'ShotState2') || isShotInProgress) return;
        
        if (ballCount === 0) {
            drawPlaceBallMessage(ctx);
            // For ShotState2, the Place.gif is handled by DOM overlay
        } else if (ballCount === 1) {
            // For ShotState, redraw the "READY" message
            if (currentFlow === 'ShotState') {
                ctx.fillStyle = '#000';
                ctx.fillRect(0, 0, LCD_WIDTH, LCD_HEIGHT);
                ctx.fillStyle = '#fff';
                ctx.font = `400 ${scaleSize(24)}px 'Barlow', sans-serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('READY', CENTER_X, CENTER_Y);
            }
            // For ShotState2, the Ready.gif is handled by DOM overlay
        } else if (ballCount > 1) {
            drawMultipleBallsMessage(ctx);
            // For ShotState2, the multiple.gif is handled by DOM overlay
        }
        
        frame++;
        if (frame < 3600) { // Run for 1 minute max, then stop to prevent infinite loops
            requestAnimationFrame(animate);
        }
    };
    
    // Start the animation loop
    requestAnimationFrame(animate);
}

// Ball button functionality
function initBallButtons() {
    const placeBallButton = document.getElementById('placeBallButton');
    const removeBallButton = document.getElementById('removeBallButton');
    const hitBallButton = document.getElementById('hitBallButton');
    
    if (placeBallButton) {
        placeBallButton.addEventListener('click', () => {
            if ((currentFlow === 'ShotState' || currentFlow === 'ShotState2') && !isShotInProgress) {
                ballCount++;
                updateBallState();
            }
        });
    }
    
    if (removeBallButton) {
        removeBallButton.addEventListener('click', () => {
            if ((currentFlow === 'ShotState' || currentFlow === 'ShotState2') && !isShotInProgress && ballCount > 0) {
                ballCount--;
                updateBallState();
            }
        });
    }
    
    if (hitBallButton) {
        hitBallButton.addEventListener('click', () => {
            if ((currentFlow === 'ShotState' || currentFlow === 'ShotState2') && ballCount === 1 && !isShotInProgress) {
                // Only allow shot when exactly one ball and green LED
                const ledLight = document.getElementById('ledLight');
                if (ledLight && ledLight.classList.contains('green')) {
                    isShotInProgress = true;
                    ballCount = 0; // Reset ball count
                    
                    // Play short beep sound just before loading starts
                    const hitSound = new Audio('Assets/game sounds/short beep.mp3');
                    hitSound.volume = 0.5;
                    hitSound.play().catch(e => console.log('Audio play failed:', e));
                    
                    // Clean up immediate ready display
                    const existingContainers = document.querySelectorAll('[data-gif-container="true"]');
                    existingContainers.forEach(container => {
                        if (container.parentNode) {
                            container.parentNode.removeChild(container);
                        }
                    });
                    
                    // Trigger the full loading sequence (white ready sequence)
                    currentStateIndex = 0; // White ready sequence with loading
                    updateDisplay();
                    
                    // Note: Shot progress is now reset directly in the white ready sequence animation
                }
            }
        });
    }
}

// Initialize ball counter display
function initBallCounter() {
    const ballCountDisplay = document.getElementById('ballCountDisplay');
    if (ballCountDisplay) {
        ballCountDisplay.textContent = ballCount;
    }
}

// Dynamic button management system
function createButton(id, text, className = 'control-button') {
    const button = document.createElement('button');
    button.id = id;
    button.textContent = text;
    button.className = className;
    return button;
}

function updateDynamicButtons() {
    const controlsContainer = document.getElementById('deviceControls');
    const ballCounter = document.getElementById('ballCounter');
    
    if (!controlsContainer) return;
    
    // Clear existing buttons
    controlsContainer.innerHTML = '';
    
    // Show/hide ball counter based on flow
    if (ballCounter) {
        ballCounter.style.display = (currentFlow === 'ShotState' || currentFlow === 'ShotState2') ? 'block' : 'none';
    }
    
    // Add buttons based on current flow
    switch(currentFlow) {
        case 'power':
            if (!isDevicePoweredOn) {
                // Show Power On button when device is off
                const powerOnBtn = createButton('powerOnButton', 'Power On');
                controlsContainer.appendChild(powerOnBtn);
                initPowerOnButton();
            } else {
                // Show Power Off and Sleep buttons when device is on
                const powerOffBtn = createButton('powerOffButton', 'Power Off');
                const sleepBtn = createButton('sleepButton', isSleepMode ? 'Wake' : 'Sleep');
                controlsContainer.appendChild(powerOffBtn);
                controlsContainer.appendChild(sleepBtn);
                initPowerOffButton();
                initSleepButton();
            }
            break;
            
        case 'ShotState':
        case 'ShotState2':
            // Show ball control buttons
            const placeBallBtn = createButton('placeBallButton', 'Place Ball');
            const removeBallBtn = createButton('removeBallButton', 'Remove Ball');
            const hitBallBtn = createButton('hitBallButton', 'Hit Ball');
            const shotSleepBtn = createButton('sleepButton', isSleepMode ? 'Wake' : 'Sleep');
            
            controlsContainer.appendChild(placeBallBtn);
            controlsContainer.appendChild(removeBallBtn);
            controlsContainer.appendChild(hitBallBtn);
            controlsContainer.appendChild(shotSleepBtn);
            
            initBallButtons();
            initSleepButton();
            break;

 
            
        default:
            // For other flows, just show sleep button
            const defaultSleepBtn = createButton('sleepButton', isSleepMode ? 'Wake' : 'Sleep');
            controlsContainer.appendChild(defaultSleepBtn);
            initSleepButton();
            break;
    }
}

// Power button functionality
function initPowerOnButton() {
    const powerOnButton = document.getElementById('powerOnButton');
    if (powerOnButton) {
        powerOnButton.addEventListener('click', () => {
            if (currentFlow === 'power') {
                isDevicePoweredOn = true;
                // Play power-up sound
                const powerUpSound = new Audio('Assets/game sounds/On relax.wav');
                powerUpSound.play();
                // Move to power on animation state
                currentStateIndex = 1;
                updateDisplay();
                // Update buttons to show power off and sleep
                updateDynamicButtons();
            }
        });
    }
}

function initPowerOffButton() {
    const powerOffButton = document.getElementById('powerOffButton');
    if (powerOffButton) {
        powerOffButton.addEventListener('click', () => {
            if (currentFlow === 'power') {
                isDevicePoweredOn = false;
                // Move to power off state
                currentStateIndex = 0; // Off state
                updateDisplay();
                // Update buttons to show power on
                updateDynamicButtons();
            }
        });
    }
}

// Initialize dynamic buttons when the page loads
document.addEventListener('DOMContentLoaded', () => {
    updateDynamicButtons();
    initBallCounter();
    loadConnectionImages();
});

// Draw minimized connection sequence for tray position
function drawMinimizedConnectionSequence(ctx, frame, transitionProgress) {
    // No tray tick needed - removed
}