'use client';

import { CrownOutlined } from '@ant-design/icons';
import { Result } from 'antd';

const HomePage = () => {
    return (
        <div style={{ padding: 20 }}>
            <Result
                icon={<CrownOutlined />}
                title="Learn fullstack Next/Nest - createdBy @Nesko"
            />
        </div>
    );
};

export default HomePage;
