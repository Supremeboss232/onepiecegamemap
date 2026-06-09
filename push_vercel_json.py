#!/usr/bin/env python3
"""
Push vercel.json to GitHub using the GitHub API.
This requires a GitHub personal access token stored in environment variable GITHUB_TOKEN
"""

import requests
import base64
import json
import os
from datetime import datetime

# Configuration
GITHUB_TOKEN = os.environ.get('GITHUB_TOKEN')
REPO_OWNER = 'Supremeboss232'
REPO_NAME = 'onepieceworldmap'
BRANCH = 'main'
FILE_PATH = 'vercel.json'
COMMIT_MESSAGE = 'Fix vercel.json: remove invalid env section referencing non-existent secrets'

def read_local_file():
    """Read the local vercel.json file"""
    with open(FILE_PATH, 'r') as f:
        return f.read()

def get_file_sha():
    """Get the current SHA of the file on GitHub"""
    url = f'https://api.github.com/repos/{REPO_OWNER}/{REPO_NAME}/contents/{FILE_PATH}'
    headers = {
        'Authorization': f'token {GITHUB_TOKEN}',
        'Accept': 'application/vnd.github.v3+json'
    }
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        return response.json()['sha']
    return None

def push_file(content, sha):
    """Push the file to GitHub"""
    url = f'https://api.github.com/repos/{REPO_OWNER}/{REPO_NAME}/contents/{FILE_PATH}'
    headers = {
        'Authorization': f'token {GITHUB_TOKEN}',
        'Accept': 'application/vnd.github.v3+json'
    }
    
    # Encode content to base64
    content_b64 = base64.b64encode(content.encode()).decode()
    
    data = {
        'message': COMMIT_MESSAGE,
        'content': content_b64,
        'sha': sha,
        'branch': BRANCH
    }
    
    response = requests.put(url, json=data, headers=headers)
    return response

# Main execution
if __name__ == '__main__':
    if not GITHUB_TOKEN:
        print("ERROR: GITHUB_TOKEN environment variable not set")
        print("Set it with: $env:GITHUB_TOKEN = 'your_token_here'")
        exit(1)
    
    print(f"Reading local {FILE_PATH}...")
    content = read_local_file()
    print(f"Content:\n{content}\n")
    
    print("Getting current file SHA from GitHub...")
    sha = get_file_sha()
    if not sha:
        print("ERROR: Could not get file SHA from GitHub")
        exit(1)
    
    print(f"Current SHA: {sha}")
    print(f"Pushing to GitHub...")
    
    response = push_file(content, sha)
    
    if response.status_code in [200, 201]:
        result = response.json()
        print(f"✅ SUCCESS! File pushed to GitHub")
        print(f"Commit SHA: {result['commit']['sha']}")
        print(f"Message: {result['commit']['message']}")
    else:
        print(f"❌ FAILED with status {response.status_code}")
        print(f"Response: {response.text}")
        exit(1)
