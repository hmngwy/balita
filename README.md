# balita
Philippine News right in your command line.

# Install
```bash
npm install -g balita
```

It's likely you'll need to sudo that.

# Usage
```bash
balita
```

![](http://i.imgur.com/HC7wyF9.png)
![](http://i.imgur.com/JmGAcYF.png)

# Why
I just woke up one morning (today, Saturday, February 28) and thought, I want to be able to read news on my terminal, I'm on the terminal all the damned time anyway. So there, a couple of hours was spent writing this.

### Where are the tests?
I uh, well do you want to write it? Fork and send me a PR. I really didn't plan to spend a lot of time on this tiny project, so there's no tests and all that jazz. :)

### What's the news source?
It's just Google News RSS with the "Philippines" filter on. The full articles are loaded via the news sites themselves.

### How it works
The RSS is stripped for titles and links and that's your main menu. 

The full articles are loaded directly from the news sites, the whole page is loaded and is passed through node-readability, this finds the article in the page. I apply some cleanup myself like condensing the paragraph spacing, indentations, and line lengths by word. 
