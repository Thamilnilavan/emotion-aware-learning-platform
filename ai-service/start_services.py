"""
Service Startup Script
Starts all microservices for the Emotion-Aware Learning Platform.
"""

import subprocess
import sys
import time
import os
from pathlib import Path

# Service configuration
SERVICES = [
    {
        'name': 'Face Detection Service',
        'script': 'services/face_detection_service.py',
        'port': 5001,
        'env_var': 'FACE_DETECTION_PORT'
    },
    {
        'name': 'Emotion Detection Service',
        'script': 'services/emotion_detection_service.py',
        'port': 5002,
        'env_var': 'EMOTION_DETECTION_PORT'
    },
    {
        'name': 'Eye Gaze Tracking Service',
        'script': 'services/eye_gaze_service.py',
        'port': 5003,
        'env_var': 'EYE_GAZE_PORT'
    },
    {
        'name': 'Head Pose Estimation Service',
        'script': 'services/head_pose_service.py',
        'port': 5004,
        'env_var': 'HEAD_POSE_PORT'
    },
    {
        'name': 'Attention Score Service',
        'script': 'services/attention_service.py',
        'port': 5005,
        'env_var': 'ATTENTION_SERVICE_PORT'
    },
    {
        'name': 'Engagement Score Service',
        'script': 'services/engagement_service.py',
        'port': 5006,
        'env_var': 'ENGAGEMENT_SERVICE_PORT'
    },
    {
        'name': 'Adaptive Intervention Engine',
        'script': 'services/intervention_service.py',
        'port': 5007,
        'env_var': 'INTERVENTION_SERVICE_PORT'
    },
    {
        'name': 'API Gateway',
        'script': 'api_gateway.py',
        'port': 5000,
        'env_var': 'GATEWAY_PORT'
    }
]

def start_service(service):
    """Start a single service."""
    script_path = Path(__file__).parent / service['script']
    
    if not script_path.exists():
        print(f"❌ Script not found: {script_path}")
        return None
    
    env = os.environ.copy()
    env[service['env_var']] = str(service['port'])
    
    print(f"🚀 Starting {service['name']} on port {service['port']}...")
    
    process = subprocess.Popen(
        [sys.executable, str(script_path)],
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE
    )
    
    return process

def check_service_health(port, service_name):
    """Check if a service is healthy."""
    import requests
    try:
        response = requests.get(f'http://localhost:{port}/health', timeout=2)
        return response.status_code == 200
    except Exception as e:
        print(f"⚠️  {service_name} health check failed: {e}")
        return False

def main():
    """Start all services."""
    print("=" * 60)
    print("Starting Emotion-Aware Learning Platform Services")
    print("=" * 60)
    
    processes = {}
    
    # Start all services
    for service in SERVICES:
        process = start_service(service)
        if process:
            processes[service['name']] = process
            time.sleep(1)  # Stagger startup
    
    print("\n" + "=" * 60)
    print("All services started. Checking health...")
    print("=" * 60)
    
    # Wait for services to be ready
    time.sleep(3)
    
    # Check health of each service
    healthy_count = 0
    for service in SERVICES:
        if check_service_health(service['port'], service['name']):
            print(f"✅ {service['name']}: Healthy")
            healthy_count += 1
        else:
            print(f"❌ {service['name']}: Unhealthy")
    
    print("\n" + "=" * 60)
    print(f"Services Status: {healthy_count}/{len(SERVICES)} healthy")
    print("=" * 60)
    
    if healthy_count == len(SERVICES):
        print("\n🎉 All services are running successfully!")
        print(f"🌐 API Gateway available at: http://localhost:5000")
        print(f"📊 Health check: http://localhost:5000/health")
    else:
        print(f"\n⚠️  Some services may not be ready. Check logs above.")
    
    print("\nPress Ctrl+C to stop all services")
    
    try:
        # Keep script running
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n\nStopping all services...")
        for name, process in processes.items():
            print(f"Stopping {name}...")
            process.terminate()
        
        # Wait for processes to terminate
        time.sleep(2)
        
        # Force kill if needed
        for name, process in processes.items():
            if process.poll() is None:
                print(f"Force killing {name}...")
                process.kill()
        
        print("All services stopped.")

if __name__ == '__main__':
    main()
