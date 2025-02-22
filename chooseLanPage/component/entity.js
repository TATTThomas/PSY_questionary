import React, { Component, Fragment } from 'react';
import { Button, Row, Col } from 'antd';

class entity extends Component {
	constructor(props) {
		super(props);
		this.state = {};
	}

	render() {
		return (
			<Fragment>
				<Row justify={'center'}>
					<Col span={12}>
						<img src='brain.png' style={{ width: '100%' }}></img>
					</Col>
				</Row>
				<br />
				<div style={{ textAlign: 'center' }}>
					<h2>歡迎進入心智評估與訓練系統</h2>
					<h3>Welcome to Mind assess and training system</h3>
				</div>
				<br />
				<Row justify={'space-around'}>
					<Col span={4}>
						<Button
							type='primary'
							shape='round'
							size={'large'}
							style={{
								backgroundColor: 'orange',
								border: 'none',
								width: '100%',
								color: 'black',
								fontWeight: 'bold',
								fontSize: '150%',
							}}
						>
							<a href='http://127.0.0.1:1337/'>中文</a>
						</Button>
					</Col>
					<Col span={4}>
						<Button
							type='primary'
							shape='round'
							size={'large'}
							style={{
								backgroundColor: 'orange',
								border: 'none',
								width: '100%',
								color: 'black',
								fontWeight: 'bold',
								fontSize: '150%',
							}}
						>
							<a href='http://127.0.0.1:1336/'>English</a>
						</Button>
					</Col>
				</Row>
			</Fragment>
		);
	}
}

export default entity;
