import React, { Component } from "react";
import { Input, Button, Layout, Typography, Row, Col, Skeleton, Alert } from "antd";
import "./Main.css";
import { SourceMap } from './constants';

const { Paragraph } = Typography;

const { Header, Content, Footer } = Layout;
const { TextArea } = Input;
// eslint-disable-next-line
const URL_REGEX = /(ftp|http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/

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

  getChapterFromName = (rawChapterName) => {
    let chapterName = rawChapterName.replace('.html', '');
    chapterName = chapterName.split('-').splice(-1)[0].split('_').splice(-1)[0];
    return chapterName;
  }

  onKenmeiConvert = (jsonInput) => {
    const result = {
      Reading: [],
      "On-Hold": [],
    }

    const { mangas } = jsonInput;
    const errorOnImport = [];
    let success = 0;
    for (const key in mangas) {
      const entry = mangas[key]
      let seriesURL = entry.manga[0];

      if (!entry.chapters) {
        errorOnImport.push(entry.manga[1])
      } else {
        let chapterList = entry.chapters.map(c => c.u).sort();
        let chapterURL = chapterList[0].split('?')[0];
        chapterURL = chapterURL[chapterURL.length - 1] === '/' ? chapterURL.slice(0, -1) : chapterURL

        const splitChapterURL = chapterURL.split('/')
        seriesURL = URL_REGEX.test(seriesURL) ? seriesURL : splitChapterURL.slice(0, -1).join('/')

        if (URL_REGEX.test(seriesURL) === false) {
          errorOnImport.push(entry.manga[1])
        }
        else {
          const chapterName = splitChapterURL.splice(-1)[0];
          const chapterNumber = this.getChapterFromName(chapterName);
          const lastRead = `c${chapterNumber}`;
          success++
          result.Reading.push({
            seriesURL,
            chapterURL,
            lastRead,
          });
        }
      }
    };
    return { errorOnImport, success, result }
  }

  onAllMangaConvert = (jsonInput) => {
    const result = {
      mangas: [
        
      ],
      bookmarks: []
    }

    const { mangas } = jsonInput;
    const errorOnImport = [];
    let success = 0;

    for (const key in mangas) {
      const entry = mangas[key]
      let u = entry.manga[0];
      let n = entry.manga[1];

      if (!entry.chapters) {
        errorOnImport.push(n)
      } else {
        let chapterList = entry.chapters.map(c => c.u).sort();
        let l = chapterList[0].split('?')[0];
        l = l[l.length - 1] === '/' ? l.slice(0, -1) : l
        success++

        let mirrorList = l.split('/').filter(a => a.includes('.'))[0];

        if (mirrorList) {
          mirrorList = mirrorList.split('.');
          let m;
          let hasMap = false;
          for (const index in mirrorList) {
            m = SourceMap[mirrorList[index]];
            if(m){
              hasMap = true;
              break;
            }
          }

          if (hasMap){
            result.mangas.push({
              u,
              n,
              l,
              m,
            });
          }
          else {
          errorOnImport.push(n)
          }
        } else {
          errorOnImport.push(n)
        }
      }
    };
    return { result, success, errorOnImport  }
  }

  onConvert = (e) => {
    const { input } = this.state;
    try {
      const jsonInput = JSON.parse(input);

      if (!jsonInput || !jsonInput.mangas) {
        throw Error("Incorrect J2K format");
      }

      const convertFunction = e.target.innerText.toLowerCase().includes('kenmei') ? this.onKenmeiConvert : this.onAllMangaConvert;
      const { errorOnImport, success, result } = convertFunction(jsonInput);

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
                <Button disabled={input === ''} type="primary" onClick={this.onConvert}>Convert to Kenmei</Button>
                <br />
                <br />
                <Button disabled={input === ''} type="primary" onClick={this.onConvert}>Convert to All Mangas</Button>
              </Col>
              <Col span={8}>
                <h3>Results</h3>
                {result ? <>
                  <Paragraph copyable={{
                   text: result
                  }}>
                    {result.length > 1000 ? `Click To Copy the result (${success})` : result}
                    
                  </Paragraph>
                  {errorOnImport && errorOnImport.length > 0 &&
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