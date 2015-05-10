-- phpMyAdmin SQL Dump
-- version 4.1.2
-- http://www.phpmyadmin.net
--
-- Host: localhost
-- Generation Time: May 10, 2015 at 09:17 AM
-- Server version: 5.5.33
-- PHP Version: 5.5.3

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

--
-- Database: `runaway_8888`
--

-- --------------------------------------------------------

--
-- Table structure for table `game`
--

CREATE TABLE `game` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `start_time` int(11) NOT NULL,
  `game_time` int(11) NOT NULL,
  `status` enum('idle','playing','end','') NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=50 ;

--
-- Dumping data for table `game`
--

INSERT INTO `game` (`id`, `start_time`, `game_time`, `status`) VALUES
(49, 1431192120, 20, 'end');

-- --------------------------------------------------------

--
-- Table structure for table `message_history`
--

CREATE TABLE `message_history` (
  `game_id` int(11) NOT NULL,
  `timestamp` int(11) NOT NULL,
  `message` text NOT NULL,
  `team_id` int(11) NOT NULL,
  KEY `game_id` (`game_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `team`
--

CREATE TABLE `team` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(200) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=5 ;

--
-- Dumping data for table `team`
--

INSERT INTO `team` (`id`, `name`) VALUES
(0, 'A隊TPA'),
(1, 'B隊閃電狼'),
(2, 'C隊百獸戰隊'),
(3, 'D隊武媚娘');

-- --------------------------------------------------------

--
-- Table structure for table `user`
--

CREATE TABLE `user` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `game_id` int(11) NOT NULL,
  `team` int(11) NOT NULL,
  `user_order` int(11) NOT NULL,
  `number` int(11) NOT NULL,
  `status` enum('idle','play','dead','rip') NOT NULL,
  `client_id` varchar(50) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `game_id` (`game_id`,`number`)
) ENGINE=InnoDB  DEFAULT CHARSET=utf8 AUTO_INCREMENT=2209 ;

--
-- Dumping data for table `user`
--

INSERT INTO `user` (`id`, `game_id`, `team`, `user_order`, `number`, `status`, `client_id`) VALUES
(2161, 49, 0, 1, 111111, 'dead', ''),
(2162, 49, 0, 2, 78086, 'idle', ''),
(2163, 49, 0, 3, 29889, 'idle', ''),
(2164, 49, 0, 4, 36025, 'idle', ''),
(2165, 49, 0, 5, 2807, 'idle', ''),
(2166, 49, 0, 6, 9079, 'idle', ''),
(2167, 49, 0, 7, 3390, 'idle', ''),
(2168, 49, 0, 8, 59606, 'idle', ''),
(2169, 49, 0, 9, 50854, 'idle', ''),
(2170, 49, 0, 10, 88930, 'idle', ''),
(2171, 49, 0, 11, 52477, 'idle', ''),
(2172, 49, 0, 12, 8207, 'idle', ''),
(2173, 49, 1, 1, 61543, 'idle', ''),
(2174, 49, 1, 2, 2222222, 'idle', ''),
(2175, 49, 1, 3, 28374, 'idle', ''),
(2176, 49, 1, 4, 18626, 'idle', ''),
(2177, 49, 1, 5, 49687, 'idle', ''),
(2178, 49, 1, 6, 14306, 'idle', ''),
(2179, 49, 1, 7, 55456, 'idle', ''),
(2180, 49, 1, 8, 6843, 'idle', ''),
(2181, 49, 1, 9, 63403, 'idle', ''),
(2182, 49, 1, 10, 58047, 'idle', ''),
(2183, 49, 1, 11, 78763, 'idle', ''),
(2184, 49, 1, 12, 97472, 'idle', ''),
(2185, 49, 2, 1, 83117, 'idle', ''),
(2186, 49, 2, 2, 35999, 'idle', ''),
(2187, 49, 2, 3, 22732, 'idle', ''),
(2188, 49, 2, 4, 46048, 'idle', ''),
(2189, 49, 2, 5, 95049, 'idle', ''),
(2190, 49, 2, 6, 38590, 'idle', ''),
(2191, 49, 2, 7, 77319, 'idle', ''),
(2192, 49, 2, 8, 71074, 'idle', ''),
(2193, 49, 2, 9, 63362, 'idle', ''),
(2194, 49, 2, 10, 81310, 'idle', ''),
(2195, 49, 2, 11, 20712, 'idle', ''),
(2196, 49, 2, 12, 49374, 'idle', ''),
(2197, 49, 3, 1, 71116, 'idle', ''),
(2198, 49, 3, 2, 22331, 'idle', ''),
(2199, 49, 3, 3, 57628, 'idle', ''),
(2200, 49, 3, 4, 27539, 'idle', ''),
(2201, 49, 3, 5, 21741, 'idle', ''),
(2202, 49, 3, 6, 27108, 'idle', ''),
(2203, 49, 3, 7, 25576, 'idle', ''),
(2204, 49, 3, 8, 33161, 'idle', ''),
(2205, 49, 3, 9, 87279, 'idle', ''),
(2206, 49, 3, 10, 95155, 'idle', ''),
(2207, 49, 3, 11, 46084, 'idle', ''),
(2208, 49, 3, 12, 77449, 'idle', '');
