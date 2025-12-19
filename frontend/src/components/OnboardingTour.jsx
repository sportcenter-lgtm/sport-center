import React, { useState, useEffect } from 'react';
import Joyride, { STATUS } from 'react-joyride';

const OnboardingTour = () => {
    const [run, setRun] = useState(false);

    useEffect(() => {
        // Check if tour has been seen
        const tourSeen = localStorage.getItem('tourSeen');
        if (!tourSeen) {
            setRun(true);
        }
    }, []);

    const handleJoyrideCallback = (data) => {
        const { status } = data;
        if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
            // Mark tour as seen
            localStorage.setItem('tourSeen', 'true');
            setRun(false);
        }
    };

    const steps = [
        {
            target: 'body',
            content: (
                <div>
                    <h3 className="font-bold text-lg mb-2">Welcome to Sports Analysis! 🎾</h3>
                    <p>Let's take a quick tour to help you get started with analyzing your game.</p>
                </div>
            ),
            placement: 'center',
            disableBeacon: true,
        },
        {
            target: '#stats-dashboard',
            content: 'This is your performance dashboard. Here you can see your skill breakdown and recent analysis history.',
        },
        {
            target: '#upload-btn',
            content: 'Ready to improve? Click here to upload a new video for AI analysis.',
        },
        {
            target: '#settings-btn',
            content: 'You can update your profile, change your password, or delete your account here.',
        }
    ];

    return (
        <Joyride
            steps={steps}
            run={run}
            continuous
            showProgress
            showSkipButton
            callback={handleJoyrideCallback}
            styles={{
                options: {
                    primaryColor: '#8b5cf6',
                    textColor: '#1f2937',
                    backgroundColor: '#ffffff',
                    arrowColor: '#ffffff',
                },
                tooltip: {
                    borderRadius: '12px',
                    padding: '20px',
                },
                buttonNext: {
                    backgroundColor: '#8b5cf6',
                    color: '#fff',
                    fontWeight: 'bold',
                    borderRadius: '8px',
                },
                buttonBack: {
                    color: '#6b7280',
                    marginRight: '10px',
                }
            }}
        />
    );
};

export default OnboardingTour;
