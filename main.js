document.addEventListener('DOMContentLoaded', () => {
    const fluidStartButton = document.getElementById('fluidStartButton');
    const entropyButton = document.getElementById('entropyButton');
    const toggleSizeButton = document.getElementById('toggleSizeButton');
    const connectRedButton = document.getElementById('connectRedButton');
    const connectGreenButton = document.getElementById('connectGreenButton');
    const densitySlider = document.getElementById('densitySlider');
    const speedSlider = document.getElementById('speedSlider');
    const timeSlider = document.getElementById('timeSlider');
    const canvas = document.getElementById('fluidCanvas');
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let particles = [];
    let confined = true;
    let numParticles = 1000; // Default particle count
    let speedMultiplier = 2; // Default speed multiplier
    let timeMultiplier = 1; // Default time multiplier
    const friction = 0.999; // Friction coefficient
    let pointSize = 2; // Default point size
    let isRunning = false; // Simulation state
    let selectedPoints = [];
    let mstEdges = [];

    densitySlider.addEventListener('input', () => {
        numParticles = parseInt(densitySlider.value, 10);
    });

    speedSlider.addEventListener('input', () => {
        speedMultiplier = parseInt(speedSlider.value, 10);
    });

    timeSlider.addEventListener('input', () => {
        timeMultiplier = parseInt(timeSlider.value, 10);
    });

    toggleSizeButton.addEventListener('click', () => {
        pointSize = pointSize === 2 ? 1 : 2;
        for (let particle of particles) {
            particle.radius = pointSize;
        }
    });

    function FluidSimulation() {
        const width = canvas.width;
        const height = canvas.height;
        const boxSize = 200; // Size of the initial confinement box

        // Initialize particles
        particles = [];
        for (let i = 0; i < numParticles; i++) {
            particles.push({
                x: Math.random() * boxSize + (width - boxSize) / 2,
                y: Math.random() * boxSize + (height - boxSize) / 2,
                vx: (Math.random() - 0.5) * speedMultiplier,
                vy: (Math.random() - 0.5) * speedMultiplier,
                radius: pointSize,
                color: '#00ff00' // Initial color is green
            });
        }

        function updateParticles() {
            for (let t = 0; t < timeMultiplier; t++) {
                for (let particle of particles) {
                    particle.vx *= friction;
                    particle.vy *= friction;

                    particle.x += particle.vx;
                    particle.y += particle.vy;

                    if (confined) {
                        if (particle.x < (width - boxSize) / 2 || particle.x > (width + boxSize) / 2) particle.vx *= -1;
                        if (particle.y < (height - boxSize) / 2 || particle.y > (height + boxSize) / 2) particle.vy *= -1;
                    } else {
                        if (particle.x < 0 || particle.x > width) particle.vx *= -1;
                        if (particle.y < 0 || particle.y > height) particle.vy *= -1;
                    }

                    // Interactions with other particles
                    for (let other of particles) {
                        if (particle !== other) {
                            let dx = other.x - particle.x;
                            let dy = other.y - particle.y;
                            let distance = Math.sqrt(dx * dx + dy * dy);
                            if (distance < particle.radius * 2) {
                                // Change color on collision
                                particle.color = particle.color === '#00ff00' ? '#ff0000' : '#00ff00';
                                other.color = other.color === '#00ff00' ? '#ff0000' : '#00ff00';

                                // Simple elastic collision
                                let angle = Math.atan2(dy, dx);
                                let speed1 = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
                                let speed2 = Math.sqrt(other.vx * other.vx + other.vy * other.vy);
                                let direction1 = Math.atan2(particle.vy, particle.vx);
                                let direction2 = Math.atan2(other.vy, other.vx);

                                let velocityX1 = speed2 * Math.cos(direction2 - angle);
                                let velocityY1 = speed1 * Math.sin(direction1 - angle);
                                let velocityX2 = speed1 * Math.cos(direction1 - angle);
                                let velocityY2 = speed2 * Math.sin(direction2 - angle);

                                particle.vx = Math.cos(angle) * velocityX1 + Math.cos(angle + Math.PI / 2) * velocityY1;
                                particle.vy = Math.sin(angle) * velocityX1 + Math.sin(angle + Math.PI / 2) * velocityY1;
                                other.vx = Math.cos(angle) * velocityX2 + Math.cos(angle + Math.PI / 2) * velocityY2;
                                other.vy = Math.sin(angle) * velocityX2 + Math.sin(angle + Math.PI / 2) * velocityY2;

                                // Separate particles slightly to prevent sticking
                                let overlap = particle.radius * 2 - distance;
                                let separation = overlap / 2;
                                particle.x -= separation * Math.cos(angle);
                                particle.y -= separation * Math.sin(angle);
                                other.x += separation * Math.cos(angle);
                                other.y += separation * Math.sin(angle);
                            }
                        }
                    }
                }
            }
        }

        function drawParticles() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw particles
            for (let particle of particles) {
                ctx.fillStyle = particle.color;
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
                ctx.fill();
            }

            // Draw selection circle
            for (let point of selectedPoints) {
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(point.x, point.y, point.radius + 3, 0, Math.PI * 2);
                ctx.stroke();
            }

            if (confined) {
                // Draw the initial confinement box
                ctx.strokeStyle = '#ffffff';
                ctx.strokeRect((canvas.width - boxSize) / 2, (canvas.height - boxSize) / 2, boxSize, boxSize);
            }
        }

        function animate() {
            updateParticles();
            drawParticles();
            if (isRunning) {
                animationFrameId = requestAnimationFrame(animate);
            }
        }

        animate();
    }

    function startSimulation() {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        confined = true;
        FluidSimulation();
    }

    function toggleSimulation() {
        if (isRunning) {
            isRunning = false;
            fluidStartButton.textContent = 'Start';
            connectRedButton.classList.remove('hidden');
            connectGreenButton.classList.remove('hidden');
            cancelAnimationFrame(animationFrameId);
        } else {
            isRunning = true;
            fluidStartButton.textContent = 'Stop';
            connectRedButton.classList.add('hidden');
            connectGreenButton.classList.add('hidden');
            startSimulation();
        }
    }

    fluidStartButton.addEventListener('click', toggleSimulation);

    entropyButton.addEventListener('click', () => {
        confined = !confined;
        entropyButton.textContent = confined ? 'Release Particles' : 'Confine Particles';
    });

    function connectPoints(color) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw particles
        for (let particle of particles) {
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
            ctx.fill();
        }

        // Draw MST connections
        ctx.strokeStyle = color;
        const selectedParticles = particles.filter(p => p.color === color);
        mstEdges = primMST(selectedParticles);
        for (let edge of mstEdges) {
            ctx.beginPath();
            ctx.moveTo(edge[0].x, edge[0].y);
            ctx.lineTo(edge[1].x, edge[1].y);
            ctx.stroke();
        }
    }

    function primMST(points) {
        const edges = [];
        const included = new Set();
        included.add(points[0]);

        while (included.size < points.length) {
            let minEdge = null;
            let minDistance = Infinity;
            for (let point of included) {
                for (let other of points) {
                    if (!included.has(other)) {
                        const distance = Math.sqrt((point.x - other.x) ** 2 + (point.y - other.y) ** 2);
                        if (distance < minDistance) {
                            minDistance = distance;
                            minEdge = [point, other];
                        }
                    }
                }
            }
            edges.push(minEdge);
            included.add(minEdge[1]);
        }
        return edges;
    }

    function findShortestPath(start, end) {
        const adjList = new Map();

        for (let edge of mstEdges) {
            if (!adjList.has(edge[0])) adjList.set(edge[0], []);
            if (!adjList.has(edge[1])) adjList.set(edge[1], []);
            adjList.get(edge[0]).push(edge[1]);
            adjList.get(edge[1]).push(edge[0]);
        }

        const queue = [[start]];
        const visited = new Set();
        visited.add(start);

        while (queue.length > 0) {
            const path = queue.shift();
            const node = path[path.length - 1];

            if (node === end) return path;

            for (let neighbor of adjList.get(node)) {
                if (!visited.has(neighbor)) {
                    visited.add(neighbor);
                    const newPath = path.concat([neighbor]);
                    queue.push(newPath);
                }
            }
        }

        return null;
    }

    function animatePath(path) {
        if (!path || path.length < 2) return;

        let step = 0;
        const totalSteps = 100;
        const drawSegment = () => {
            if (step >= totalSteps * (path.length - 1)) return;

            const segmentIndex = Math.floor(step / totalSteps);
            const t = (step % totalSteps) / totalSteps;
            const x1 = path[segmentIndex].x;
            const y1 = path[segmentIndex].y;
            const x2 = path[segmentIndex + 1].x;
            const y2 = path[segmentIndex + 1].y;
            const x = x1 + (x2 - x1) * t;
            const y = y1 + (y2 - y1) * t;

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            drawParticles();

            ctx.strokeStyle = `rgba(255, 0, 0, ${1 - t})`;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x, y);
            ctx.stroke();

            step++;
            requestAnimationFrame(drawSegment);
        };

        drawSegment();
    }

    connectRedButton.addEventListener('click', () => connectPoints('#ff0000'));
    connectGreenButton.addEventListener('click', () => connectPoints('#00ff00'));

    canvas.addEventListener('click', (event) => {
        if (selectedPoints.length < 2) {
            const rect = canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            const clickedParticle = particles.find(p => Math.hypot(p.x - x, p.y - y) < p.radius);
            if (clickedParticle) {
                selectedPoints.push(clickedParticle);
                if (selectedPoints.length === 2) {
                    const path = findShortestPath(selectedPoints[0], selectedPoints[1]);
                    animatePath(path);
                    selectedPoints = [];
                }
            }
        }
    });
});
