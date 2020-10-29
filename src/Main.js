import React, { Component } from "react";
import { Input, Button, Layout, Typography, Row, Col, Skeleton, Alert } from "antd";
import "./Main.css";


const { Paragraph } = Typography;

const { Header, Content, Footer } = Layout;
const { TextArea } = Input;
const URL_REGEX = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/g

class Main extends Component {
  constructor(props) {
    super(props);

    this.state = {
      result: '',
      input: '',
      error: undefined,
      errorOnImport: undefined,
      success: 0,
    }

  }

  onConvert = () => {
    const { input } = this.state;
    try {
      const jsonInput = JSON.parse(input);

      if (!jsonInput || !jsonInput.mangas) {
        throw Error("Incorrect J2K format");
      }

      const result = {
        Reading: [],
        "On-Hold": [],
      }

      const { mangas } = jsonInput;
      const errorOnImport = [];
      let success = 0;
      mangas.forEach(entry => {
        const seriesURL = entry.manga[0]
        if (!entry.chapters || !seriesURL.match(URL_REGEX)) {
          errorOnImport.push(entry.manga[1])
        } else {
          const chapterList = entry.chapters.map(c => c.u).sort();
          let chapterURL = chapterList[0].split('?')[0];
          chapterURL = chapterURL[chapterURL.length - 1] === '/' ? chapterURL.slice(0, -1) : chapterURL
          const lastRead = chapterURL.split('/').splice(-1)[0];
          success++
          result.Reading.push({
            seriesURL,
            chapterURL,
            lastRead,
        });
        }

      });

      this.setState({
        result: JSON.stringify(result, null, 4),
        errorOnImport: errorOnImport.length > 0 ? errorOnImport : undefined,
        success,
      })
    }
    catch (err) {
      this.setState({
        error: `Error Parsing the json: ${err}`,
        result: undefined,
        errorOnImport: undefined,
        success: 0,
      });
      return;
    }
  }

  onChangeData = (e) => {
    const { input } = this.state;
    const { target: { value } } = e
    if (input !== value) {
      this.setState({
        input: value, 
        error: undefined,
        errorOnImport: undefined,
        success: 0,
      })
    }
  }

  render() {
    const { input, result, error, errorOnImport, success } = this.state;
    console.log(errorOnImport);
    return (
      <Layout className="layout">
        <Header>
          <h2 className="title">J2k Exporter</h2>
        </Header>
        <Content style={{ padding: '0 50px' }}>
          <div className="site-layout-content">
            {error && <Alert message={error} style={{ margin: 20 }} type="error" />}
            <Row align="top" style={{ height: "100%" }} justify="center">
              <Col style={{ height: "80%" }} span={8}>
                <h3>Paste your J2k backup here</h3>
                <TextArea value={input} onChange={this.onChangeData} style={{ height: "100%" }} />
              </Col>
              <Col style={{ textAlign: 'center' }} span={8}>
                <Button disabled={input === ''} type="primary" onClick={this.onConvert}>Convert</Button>
              </Col>
              <Col span={8}>
                <h3>Results</h3>
                {result ? <>
                  <Paragraph copyable={{
                   text: result
                  }}>
                    {result.length > 1000 ? `Click To Copy the result (${success})` : result}
                    
                  </Paragraph>
                  {errorOnImport &&
                    <Paragraph
                      copyable={{
                        text: errorOnImport.join('\n')
                      }}
                      ellipsis>
                    {`Click to copy the failed list (${errorOnImport.length+1})`}
                    </Paragraph>
                  }
                </>
                  : <Skeleton />}
              </Col>
            </Row>
          </div>
        </Content>
        <Footer style={{ textAlign: 'center' }}> ©2020 Created by fdssimoes</Footer>
      </Layout>
    );
  }
}

export default Main;